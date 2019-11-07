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



var Params = {};
Params.MaxScore = 0.5;
Params.LineWidth = 0.0015;
Params.BoneCount = 64;

var ParamsWindow = CreateParamsWindow( Params, function(){}, [800,100,500,200] );
ParamsWindow.AddParam('MaxScore',0,1);
ParamsWindow.AddParam('LineWidth',0.0001,0.01);
ParamsWindow.AddParam('BoneCount',1,64,Math.floor);


function LabelsToSkeleton(Labels)
{
	const Skeleton = {};
	
	function LabelToPoint(Label)
	{
		const Rect = [ Label.x, Label.y, Label.w, Label.h ];
		const u = Label.x + (Label.w/2);
		const v = Label.y + (Label.h/2);
		const Score = Label.Score;	//	all 1 atm
		Skeleton[Label.Label] = [u,v,Score];
	}
	Labels.forEach( LabelToPoint );

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
	
	function PointJointRect(Joint)
	{
		try
		{
			const uvscore = Skeleton[Joint];
			const Score = uvscore[2];
			const Size = Params.LineWidth;
			const l = uvscore[0]-Size;
			const r = uvscore[0]+Size;
			const t = uvscore[1]-Size;
			const b = uvscore[1]+Size;
			PushLine( [l,t], [r,t], Score );
			PushLine( [r,t], [r,b], Score );
			PushLine( [r,b], [l,b], Score );
			PushLine( [l,b], [l,t], Score );
		}
		catch(e)
		{
			Pop.Debug(e);
		}
	}
	
	function PushBone(JointAB,Index)
	{
		if ( Index >= Params.BoneCount )
			return;
		try
		{
			const JointA = JointAB[0];
			const JointB = JointAB[1];
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
	
	//Object.keys(Skeleton).forEach( PointJointRect );

	const Bones =
	[
	 //	left eyebrow
	 ['FaceLandmark00','FaceLandmark01'],
	 ['FaceLandmark01','FaceLandmark02'],
	 ['FaceLandmark02','FaceLandmark03'],
	 //	right eyebrow
	 ['FaceLandmark04','FaceLandmark05'],
	 ['FaceLandmark05','FaceLandmark06'],
	 ['FaceLandmark06','FaceLandmark07'],
	 //	left eye
	 ['FaceLandmark08','FaceLandmark09'],
	 ['FaceLandmark09','FaceLandmark10'],
	 ['FaceLandmark10','FaceLandmark11'],
	 ['FaceLandmark11','FaceLandmark12'],
	 ['FaceLandmark12','FaceLandmark13'],
	 ['FaceLandmark13','FaceLandmark14'],
	 ['FaceLandmark14','FaceLandmark15'],
	  ['FaceLandmark15','FaceLandmark08'],	//	close eye loop
		//	right eye
	['FaceLandmark16','FaceLandmark17'],
	 ['FaceLandmark17','FaceLandmark18'],
	 ['FaceLandmark18','FaceLandmark19'],
	 ['FaceLandmark19','FaceLandmark20'],
	 ['FaceLandmark20','FaceLandmark21'],
	 ['FaceLandmark21','FaceLandmark22'],
	 ['FaceLandmark22','FaceLandmark23'],
	 ['FaceLandmark23','FaceLandmark16'],	//	close eye loop
	 //['FaceLandmark23','FaceLandmark24'],
	 //	mouth
	 ['FaceLandmark24','FaceLandmark25'],
	 ['FaceLandmark25','FaceLandmark26'],
	 ['FaceLandmark26','FaceLandmark27'],
	 ['FaceLandmark27','FaceLandmark28'],
	 ['FaceLandmark28','FaceLandmark29'],
	 ['FaceLandmark29','FaceLandmark30'],
	 ['FaceLandmark30','FaceLandmark31'],
	 ['FaceLandmark31','FaceLandmark32'],
	 ['FaceLandmark32','FaceLandmark33'],
	 ['FaceLandmark33','FaceLandmark24'],	//	close mouth loop
	 //['FaceLandmark33','FaceLandmark34'],
	 //teeth
	 ['FaceLandmark34','FaceLandmark35'],
	 ['FaceLandmark35','FaceLandmark36'],
	 ['FaceLandmark36','FaceLandmark37'],
	 ['FaceLandmark37','FaceLandmark38'],
	 ['FaceLandmark38','FaceLandmark39'],
	 ['FaceLandmark39','FaceLandmark34'],	//	close teeth loop

	 //	chin
	 //['FaceLandmark39','FaceLandmark40'],
	 ['FaceLandmark40','FaceLandmark41'],
	 ['FaceLandmark41','FaceLandmark42'],
	 ['FaceLandmark42','FaceLandmark43'],
	 ['FaceLandmark43','FaceLandmark44'],
	 ['FaceLandmark44','FaceLandmark45'],
	 ['FaceLandmark45','FaceLandmark46'],
	 ['FaceLandmark46','FaceLandmark47'],
	 ['FaceLandmark47','FaceLandmark48'],
	 ['FaceLandmark48','FaceLandmark49'],
	 ['FaceLandmark49','FaceLandmark50'],
	 
	 //	nose
	 //['FaceLandmark50','FaceLandmark51'],
	 ['FaceLandmark51','FaceLandmark52'],
	 ['FaceLandmark52','FaceLandmark53'],
	 ['FaceLandmark53','FaceLandmark54'],
	 ['FaceLandmark54','FaceLandmark55'],
	 ['FaceLandmark55','FaceLandmark56'],
	 ['FaceLandmark56','FaceLandmark57'],
	 ['FaceLandmark57','FaceLandmark58'],
	 ['FaceLandmark58','FaceLandmark59'],
	 //['FaceLandmark59','FaceLandmark60'],
	 
	 //	nose center line
	 ['FaceLandmark60','FaceLandmark61'],
	 ['FaceLandmark61','FaceLandmark62'],
	 
	 //	eyes
	 //['FaceLandmark62','FaceLandmark63'],
	 ['FaceLandmark63','FaceLandmark64'],
	];
	Bones.forEach( PushBone );
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
				
				const Luma = new Pop.Image();
				Luma.Copy( NewTexures[0] );
				Luma.Resize( 512, 256 );
				Luma.SetFormat('Greyscale');
				
				const Face = await Coreml.AppleVisionFaceDetect( Luma );
				this.Skeleton = LabelsToSkeleton( Face );
				//Pop.Debug(JSON.stringify(this.Skeleton));
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
		
		if ( !CameraName.includes('Face') )
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
			Devices.reverse();
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
