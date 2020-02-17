let Debug = Pop.Debug;

let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let Uvy844FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv888FragShader = Pop.LoadFileAsString('Yuv8_88.frag.glsl');
let Yuv8888FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let KinectDepthFragShader = Pop.LoadFileAsString('KinectDepth.frag.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let UyvyFragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');

//let GetChromaUvy844Shader = Pop.LoadFileAsString('GetChroma_Uvy844.frag.glsl');

const Params = {};
Params.KinectDepth = 4000;

const ParamsWindow = new Pop.ParamsWindow(Params);
ParamsWindow.AddParam('KinectDepth',0,65500);

function TCameraWindow(CameraName)
{
	this.Textures = [];
	this.CameraFrameCounter = new Pop.FrameCounter( CameraName );

	this.OnRender = function(RenderTarget)
	{
		if ( !this.Source )
		{
			RenderTarget.ClearColour(255,0,0);
			return;
		}

		if ( !this.Textures.length )
		{
			RenderTarget.ClearColour(0,0,255);
			return;
		}

		let Texture0 = this.Textures[0];
		let Texture1 = this.Textures[1];
		let Texture2 = this.Textures[2];
		
		//Pop.Debug(Texture0.GetFormat());
		let ShaderSource = BlitFragShader;
		
		if ( Texture0.GetFormat() == "YYuv_8888_Full" )
			ShaderSource = Yuv8888FragShader;
		else if ( Texture0.GetFormat() == "YYuv_8888_Ntsc" )
			ShaderSource = Yuv8888FragShader;
		else if ( Texture0.GetFormat() == "Uvy_844_Full" )
			ShaderSource = Uvy844FragShader;
		else if ( Texture0.GetFormat() == "Greyscale" && this.Textures.length == 3 )
			ShaderSource = Yuv8_8_8_MultiImageFragShader;
		else if (Texture0.GetFormat() == "RGBA")
			ShaderSource = BlitFragShader;
		else if (Texture0.GetFormat() == "Greyscale")
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
			this.Textures.forEach( t => Formats.push(t.GetFormat() ));
			Pop.Debug("No specific shader for "+ Formats.join(',') );
		}
		
		
		let FragShader = Pop.GetShader( RenderTarget, ShaderSource );

		let SetUniforms = function(Shader)
		{
			Shader.SetUniform("Texture", Texture0 );
			Shader.SetUniform("TextureWidth", Texture0.GetWidth());
			Shader.SetUniform("LumaTexture", Texture0 );
			Shader.SetUniform("ChromaTexture", Texture1 );
			Shader.SetUniform("ChromaUTexture", Texture1 );
			Shader.SetUniform("ChromaVTexture", Texture2 );
			Shader.SetUniform("Yuv_8_8_8_Texture",Texture0);

			Shader.SetUniform("DepthMax",Params.KinectDepth);			
		}
		RenderTarget.DrawQuad( FragShader, SetUniforms );
	}
	
	
	this.ListenForFrames = async function ()
	{
		while (true)
		{
			try
			{
				const NewFrame = await this.Source.WaitForNextFrame();

				//this.Textures = [NewFrame.Plane0];
				this.Textures = NewFrame.Planes;
				this.CameraFrameCounter.Add();
			}
			catch (e)
			{
				//	sometimes OnFrameExtracted gets triggered, but there's no frame? (usually first few on some cameras)
				//	so that gets passed up here. catch it, but make sure we re-request
				if (e != "No frame packet buffered")
					Pop.Debug(CameraName + " ListenForFrames: " + e);
			}
		}
	}
	
	this.Window = new Pop.Opengl.Window(CameraName);
	this.Window.OnRender = this.OnRender.bind(this);
	this.Window.OnMouseMove = function(){};
	this.Window.OnMouseDown = function(){};
	this.Window.OnMouseUp = function () { };

	const LatestOnly = true;
	this.Source = new Pop.Media.Source(CameraName,undefined,LatestOnly);
	Pop.Debug("Start listening");
	this.ListenForFrames().catch(Debug);
	
}


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

		if (CameraName.includes("Microphone"))
			return;
		if (CameraName.includes("Kinect2"))
			return;
		if (CameraName.includes("Kinect"))
			return;

		if ( CameraName == "Test")
			return;
	
		if ( !CameraName.includes("Pengo") )
		{
			//return;
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
		CreateCamera('000396300112');
		return;
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
