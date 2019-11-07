Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('../PopEngineCommon/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');
Pop.Include('../PopEngineCommon/MemCheckLoop.js');
Pop.Include('../PopEngineCommon/PopMath.js');
Pop.Include('../PopEngineCommon/ParamsWindow.js');

const VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
const GreyscaleFragShader = Pop.LoadFileAsString('Greyscale.frag.glsl');
const SkeletonFragShader = Pop.LoadFileAsString('DrawLines.frag.glsl');

const SkeletonJointNames =
[
 'Head',
 'LeftShoulder',		'LeftElbow',	'LeftHand',		'LeftHip',	'LeftKnee',		'LeftFoot',
 'RightShoulder',	'RightElbow',	'RightHand',	'RightHip',	'RightKnee',	'RightFoot',
];


var Params = {};
Params.MaxScore = 0.5;
Params.LineWidth = 0.005;

var ParamsWindow = CreateParamsWindow( Params, function(){}, [800,100,500,200] );
ParamsWindow.AddParam('MaxScore',0,1);
ParamsWindow.AddParam('LineWidth',0.0001,0.01);


function LabelMapToSkeleton(LabelMap)
{
	if ( !LabelMap.Meta )
	{
		Pop.Debug( JSON.stringify(LabelMap) );
		throw "Label map missing meta";
	}
	
	function IndexToUv(Index)
	{
		const Width = LabelMap.Meta.Width;
		const Height = LabelMap.Meta.Height;
		const x = Index / Width;
		const y = Index % Width;
		const u = x / Width;
		const v = y / Height;
		return [u,v];
	}
	
	function FindBestUvScore(MapFloats)
	{
		if ( !MapFloats )
			return null;
		
		let HighestIndex = 0;
		let HighestValue = MapFloats[HighestIndex];
		for ( let i=0;	i<MapFloats.length;	i++ )
		{
			const Value = MapFloats[i];
			if ( Value <= HighestValue )
				continue;
			HighestIndex = i;
			HighestValue = Value;
		}
		let uvscore = IndexToUv(HighestIndex);
		uvscore.push( HighestValue );
		return uvscore;
	}
	
	//	todo: get a map from one label set to joints
	const Skeleton = {};
	function MapLabelToJoint(Label)
	{
		const Joint = Label;
		Skeleton[Joint] = FindBestUvScore( LabelMap[Label] );
	}
	SkeletonJointNames.forEach( MapLabelToJoint );
	return Skeleton;
}


function RenderVideoImage(RenderTarget,VideoTexture)
{
	let FragShader = Pop.GetShader( RenderTarget, GreyscaleFragShader, VertShader );
	let SetUniforms = function(Shader)
	{
		Shader.SetUniform("Texture", VideoTexture );
	}
	RenderTarget.DrawQuad( FragShader, SetUniforms );
}


function GetSkeletonLines(Skeleton,Lines,Scores)
{
	function PushLine(Start,End,Score)
	{
		Lines.push( Start[0] );
		Lines.push( Start[1] );
		Lines.push( End[0] );
		Lines.push( End[1] );
		Scores.push( Score );
	}
	
	if ( !Skeleton )
	{
		//	draw x
		PushLine( [0,0], [1,1], 0 );
		PushLine( [1,0], [0,1], 0 );
		return;
	}
	
	function PushBone(JointA,JointB)
	{
		try
		{
			const a = Skeleton[JointA];
			const b = Skeleton[JointB];
			const Score = (a[2] + b[2]) / 2;
			PushLine( a, b, Score );
		}
		catch(e)
		{
			//	missing joint
		}
	}
	
	PushBone('Head','LeftShoulder');
	PushBone('Head','RightShoulder');
	PushBone('LeftShoulder','RightShoulder');
	PushBone('LeftHip','RightHip');
	PushBone('LeftShoulder','LeftElbow');
	PushBone('LeftElbow','LeftHand');
	PushBone('LeftShoulder','LeftHip');
	PushBone('LeftHip','LeftKnee');
	PushBone('LeftKnee','LeftFoot');
	PushBone('RightShoulder','RightElbow');
	PushBone('RightElbow','RightHand');
	PushBone('RightShoulder','RightHip');
	PushBone('RightHip','RightKnee');
	PushBone('RightKnee','RightFoot');
	
}


function RenderSkeleton(RenderTarget,Skeleton)
{
	//	make lines from skeleton
	let Lines = [];
	let Scores = [];
	GetSkeletonLines( Skeleton, Lines, Scores );
	
	let FragShader = Pop.GetShader( RenderTarget, SkeletonFragShader, VertShader );
	let SetUniforms = function(Shader)
	{
		Shader.SetUniform("Lines", Lines );
		Shader.SetUniform("Scores", Scores );
		Shader.SetUniform("ScoreMax", Params.MaxScore );
		Shader.SetUniform("LineWidth", Params.LineWidth );
	}
	RenderTarget.EnableBlend(true);
	RenderTarget.DrawQuad( FragShader, SetUniforms );
}

function TCameraWindow(CameraName)
{
	this.Skeleton = null;
	this.VideoTexture = null;
	this.CameraFrameCounter = new Pop.FrameCounter( CameraName );
	
	this.OnRender = function(RenderTarget)
	{
		if ( !this.Source )
		{
			RenderTarget.ClearColour(255,0,0);
			return;
		}
		
		if ( !this.VideoTexture )
		{
			RenderTarget.ClearColour(0,0,255);
			return;
		}
		
		RenderVideoImage( RenderTarget, this.VideoTexture );
		RenderSkeleton( RenderTarget, this.Skeleton );
	}
	
	this.ProcessNextFrame = async function(FrameBuffer)
	{
		const Stream = 0;
		const Latest = true;
		//let NextFrame = await this.Source.GetNextFrame( Planes, Stream, Latest );
		//let NextFrame = await this.Source.GetNextFrame( undefined, Stream, Latest );
		const NextFrame = await this.Source.GetNextFrame( FrameBuffer, Stream, Latest );
		//NextFrame = null;
		//Pop.GarbageCollect();
		//return;
		
		const NewFrame = NextFrame ? NextFrame : FrameBuffer;
		if ( !NewFrame )
			return null;
		
		if ( !NewFrame.Planes )
			return [NewFrame];
		
		return NewFrame.Planes;
	}
	
	this.ListenForFrames = async function()
	{
		const FrameBuffer = new Pop.Image();
		//const FrameBuffer = undefined;
		while ( true )
		{
			try
			{
				await Pop.Yield(5);
				const fb = FrameBuffer;
				const NewTexures = await this.ProcessNextFrame(fb);
				if ( !NewTexures )
					continue;
				
				let Luma;
				//	copy image if we're using a frame buffer, otherwise when we render we see the next frame
				if ( FrameBuffer )
				{
					Luma = new Pop.Image();
					Luma.Copy( NewTexures[0] );
				}
				else
				{
					Luma = NewTexures[0];
				}
				Luma.SetFormat('Greyscale');
				
				if ( true )
				{
					Luma.Resize(368,368);
					const LabelMap = await Coreml.OpenPoseLabelMap( Luma );
					this.Skeleton = LabelMapToSkeleton( LabelMap );
				}

				/*
				if ( false )
				{
					NewTexures[0].Resize(416,416);
					NewTexures[0].SetFormat('Greyscale');
					const Pose = await Coreml.Yolo(NewTexures[0]);
					Pop.Debug("Pose",JSON.stringify(Pose));
					this.Rects = GetRectsFromObjects( Pose, 0.2 );
				}
				if ( false )
				{
					NewTexures[0].Resize(368,368);
					NewTexures[0].SetFormat('Greyscale');
					const Pose = await Coreml.OpenPose(NewTexures[0]);
					//Pop.Debug("Pose",JSON.stringify(Pose));
					this.Rects = GetRectsFromObjects( Pose, 0 );
				}
				if ( false )
				{
					NewTexures[0].Resize(192,192);
					NewTexures[0].SetFormat('Greyscale');
					const Pose = await Coreml.Hourglass(NewTexures[0]);
					//Pop.Debug("Pose",JSON.stringify(Pose));
					this.Rects = GetRectsFromObjects( Pose, 0 );
				}
				if ( true )
				{
					NewTexures[0].Resize(300,300);
					NewTexures[0].SetFormat('Greyscale');
					const Pose = await Coreml.SsdMobileNet(NewTexures[0]);
					Pop.Debug("Pose",JSON.stringify(Pose));
					this.Rects = GetRectsFromObjects( Pose, 0 );
				}
				if ( false )
				{
					NewTexures[0].Resize(192,192);
					NewTexures[0].SetFormat('Greyscale');
					const Pose = await Coreml.Cpm(NewTexures[0]);
					//Pop.Debug("Pose",JSON.stringify(Pose));
					this.Rects = GetRectsFromObjects( Pose, 0 );
				}
				if ( false )
				{
					//NewTexures[0].Resize(512,512);
					NewTexures[0].SetFormat('Greyscale');
					//NewTexures[0].SetFormat('RGB');
					const Pose = await Coreml.AppleVisionFaceDetect(NewTexures[0]);
					//Pop.Debug("Pose",JSON.stringify(Pose));
					this.Rects = GetRectsFromObjects( Pose );
				}
				*/
				if ( this.VideoTexture )
					this.VideoTexture.Clear();
				this.VideoTexture = Luma;
				this.CameraFrameCounter.Add();
			}
			catch(e)
			{
				//	sometimes OnFrameExtracted gets triggered, but there's no frame? (usually first few on some cameras)
				//	so that gets passed up here. catch it, but make sure we re-request
				if ( e != "No frame packet buffered" )
					Pop.Debug( CameraName + " ListenForFrames: " + e);
			}
		}
	}
	
	this.Window = new Pop.Opengl.Window(CameraName);
	this.Window.OnRender = this.OnRender.bind(this);
	this.Window.OnMouseMove = function(){};
	this.Window.OnMouseDown = function(){};
	this.Window.OnMouseUp = function(){};
	this.Source = new Pop.Media.Source(CameraName);
	this.ListenForFrames().catch(Pop.Debug);
	
}


let Coreml = new Pop.CoreMl();

let CameraWindows = [];

async function FindCamerasLoop()
{
	let CreateCamera = function(CameraName)
	{
		
		if ( CameraWindows.hasOwnProperty(CameraName) )
		{
			Pop.Debug("Already have window for " + CameraName);
			return;
		}
		
		if ( CameraName == "Test")
			return;
		
		if ( !CameraName.includes("Pengo") )
		{
			//return;
		}
		
		if ( !CameraName.includes('iSight') )
		{
			return;
		}
		
		try
		{
			let Window = new TCameraWindow(CameraName);
			CameraWindows.push(Window);
		}
		catch(e)
		{
			Pop.Debug(e);
		}
	}
	
	while ( true )
	{
		try
		{
			let Devices = await Pop.Media.EnumDevices();
			Pop.Debug("Pop.Media.EnumDevices found(" + Devices + ") result type=" + (typeof Devices) );
			//Devices.reverse();
			//CreateCamera(Devices[0]);
			Devices.forEach( CreateCamera );
			await Pop.Yield( 1 );
			
			//	todo: EnumDevices needs to change to "OnDevicesChanged"
			break;
		}
		catch(e)
		{
			Pop.Debug("FindCamerasLoop error: " + e );
		}
	}
}

//	start tracking cameras
FindCamerasLoop().catch(Pop.Debug);
