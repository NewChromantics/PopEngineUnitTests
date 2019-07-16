let Debug = Pop.Debug;

let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let Uvy844FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv888FragShader = Pop.LoadFileAsString('Yuv8_88.frag.glsl');
let Yuv8888FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let KinectDepthFragShader = Pop.LoadFileAsString('KinectDepth.frag.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let UyvyFragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let GreyscaleFragShader = Pop.LoadFileAsString('Greyscale.frag.glsl');

let MaskShaderSource = Pop.LoadFileAsString('Mask.frag.glsl');

//let GetChromaUvy844Shader = Pop.LoadFileAsString('GetChroma_Uvy844.frag.glsl');



function TCameraWindow(CameraName)
{
	this.VideoTextures = [];
	this.BackgroundTexture = null;
	this.CameraFrameCounter = new Pop.FrameCounter( CameraName );

	this.OnRender = function(RenderTarget)
	{
		if ( !this.Source )
		{
			RenderTarget.ClearColour(255,0,0);
			return;
		}

		if ( !this.VideoTextures.length )
		{
			RenderTarget.ClearColour(0,0,255);
			return;
		}

		let Texture0 = this.VideoTextures[0];
		let Texture1 = this.VideoTextures[1];
		let Texture2 = this.VideoTextures[2];
		
		//Pop.Debug(Texture0.GetFormat());
		let ShaderSource = BlitFragShader;
		
		if ( Texture0.GetFormat() == "YYuv_8888_Full" )
			ShaderSource = Yuv8888FragShader;
		else if ( Texture0.GetFormat() == "YYuv_8888_Ntsc" )
			ShaderSource = Yuv8888FragShader;
		else if ( Texture0.GetFormat() == "Uvy_844_Full" )
			ShaderSource = Uvy844FragShader;
		else if ( Texture0.GetFormat() == "Greyscale" && this.VideoTextures.length == 3 )
			ShaderSource = Yuv8_8_8_MultiImageFragShader;
		else if ( Texture0.GetFormat() == "Greyscale" )
			ShaderSource = GreyscaleFragShader;
		else if ( Texture0.GetFormat() == "RGBA" )
			ShaderSource = BlitFragShader;
		else if ( Texture0.GetFormat() == "Yuv_8_8_8_Full" )
			ShaderSource = Yuv8_8_8FragShader;
		else if ( Texture0.GetFormat() == "KinectDepth" )
			ShaderSource = KinectDepthFragShader;
		else if ( Texture0.GetFormat() == "FreenectDepthmm" )
			ShaderSource = KinectDepthFragShader;
		else if ( Texture0.GetFormat() == "uyvy" )
			ShaderSource = UyvyFragShader;
		else
		{
			let Formats = [];
			this.VideoTextures.forEach( t => Formats.push(t.GetFormat() ));
			Pop.Debug("No specific shader for "+ Formats.join(',') );
		}
		

		{
			let FragShader = Pop.GetShader( RenderTarget, ShaderSource );
			let SetUniforms = function(Shader)
			{
				Shader.SetUniform("Texture", Texture0 );
				Shader.SetUniform("TextureWidth", Texture0.GetWidth());
				Shader.SetUniform("LumaTexture", Texture0 );
				Shader.SetUniform("ChromaTexture", Texture1 );
				Shader.SetUniform("ChromaUTexture", Texture1 );
				Shader.SetUniform("ChromaVTexture", Texture2 );
				Shader.SetUniform("Yuv_8_8_8_Texture", Texture0 );
			}
			RenderTarget.DrawQuad( FragShader, SetUniforms );
		}
		
		if ( this.BackgroundTexture )
		{
			let MaskTexture = this.BackgroundTexture;
			let MaskShader = Pop.GetShader( RenderTarget, MaskShaderSource );
			let SetUniforms = function(Shader)
			{
				Shader.SetUniform("Texture", MaskTexture );
			}
			RenderTarget.EnableBlend(true);
			RenderTarget.DrawQuad( MaskShader, SetUniforms );
		}
		
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
				await Pop.Yield(10);
				const fb = FrameBuffer;
				const NewTexures = await this.ProcessNextFrame(fb);
				if ( !NewTexures )
					continue;
				
				NewTexures[0].Resize(368,368);
				NewTexures[0].SetFormat('Greyscale');
				const Pose = await Coreml.OpenPoseMap(NewTexures[0], 'Background');
				Pop.Debug("Pose",JSON.stringify(Pose));
				
				this.VideoTextures = NewTexures;
				this.BackgroundTexture = Pose;
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
	this.ListenForFrames().catch(Debug);
	
}


let Coreml = new Pop.CoreMl();

let CameraWindows = [];

async function FindCamerasLoop()
{
	let CreateCamera = function(CameraName)
	{
		
		if ( CameraWindows.hasOwnProperty(CameraName) )
		{
			Debug("Already have window for " + CameraName);
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
			Debug(e);
		}
	}
	
	while ( true )
	{
		try
		{
			let Devices = await Pop.Media.EnumDevices();
			Debug("Pop.Media.EnumDevices found(" + Devices + ") result type=" + (typeof Devices) );
			//Devices.reverse();
			//CreateCamera(Devices[0]);
			Devices.forEach( CreateCamera );
			await Pop.Yield( 1 );
			
			//	todo: EnumDevices needs to change to "OnDevicesChanged"
			break;
		}
		catch(e)
		{
			Debug("FindCamerasLoop error: " + e );
		}
	}
}

//	start tracking cameras
FindCamerasLoop().catch(Debug);
