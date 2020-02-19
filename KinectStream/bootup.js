Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

const EngineDebug = new Pop.Engine.StatsWindow();

Pop.Include('../PopEngineCommon/PopApi.js');
Pop.Include('../PopEngineCommon/PopMath.js');	//	needed by ParamsWindow
Pop.Include('../PopEngineCommon/ParamsWindow.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');
//Pop.Include('../PopEngineCommon/MemCheckLoop.js');


let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let Uvy844FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv888FragShader = Pop.LoadFileAsString('Yuv8_88.frag.glsl');
let Yuv8888FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let Yuv8_8_8FragShader = Pop.LoadFileAsString('Yuv8_8_8.frag.glsl');
let KinectDepthFragShader = Pop.LoadFileAsString('KinectDepth.frag.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let UyvyFragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');

//let GetChromaUvy844Shader = Pop.LoadFileAsString('GetChroma_Uvy844.frag.glsl');

const Params = {};
Params.KinectDepth = 4000;
Params.EncodeQuality = 1;

const ParamsWindow = new Pop.ParamsWindow(Params);
ParamsWindow.AddParam('KinectDepth',0,65500);
ParamsWindow.AddParam('EncodeQuality',0,10,Math.floor);



function RenderKinect(RenderTarget,DepthTexture)
{
	if (!DepthTexture)
	{
		RenderTarget.ClearColour(255,0,0);
		return;
	}

	const Textures = [DepthTexture];
	const Texture0 = Textures[0];

	//Pop.Debug(Texture0.GetFormat());
	let ShaderSource = BlitFragShader;

	if (Texture0.GetFormat() == "YYuv_8888_Full")
		ShaderSource = Yuv8888FragShader;
	else if (Texture0.GetFormat() == "YYuv_8888_Ntsc")
		ShaderSource = Yuv8888FragShader;
	else if (Texture0.GetFormat() == "Uvy_844_Full")
		ShaderSource = Uvy844FragShader;
	else if (Texture0.GetFormat() == "Greyscale" && Textures.length == 3)
		ShaderSource = Yuv8_8_8_MultiImageFragShader;
	else if (Texture0.GetFormat() == "RGBA")
		ShaderSource = BlitFragShader;
	else if (Texture0.GetFormat() == "Greyscale")
		ShaderSource = BlitFragShader;
	else if (Texture0.GetFormat() == "Yuv_8_8_8_Full")
		ShaderSource = Yuv8_8_8FragShader;
	else if (Texture0.GetFormat() == "Yuv_8_8_8_Ntsc")
		ShaderSource = Yuv8_8_8FragShader;
	else if (Texture0.GetFormat() == "KinectDepth")
		ShaderSource = KinectDepthFragShader;
	else if (Texture0.GetFormat() == "FreenectDepthmm")
		ShaderSource = KinectDepthFragShader;
	else if (Texture0.GetFormat() == "uyvy")
		ShaderSource = UyvyFragShader;
	else
	{
		let Formats = [];
		Textures.forEach(t => Formats.push(t.GetFormat()));
		Pop.Debug("No specific shader for " + Formats.join(','));
	}

	let FragShader = Pop.GetShader(RenderTarget,ShaderSource);

	let SetUniforms = function (Shader)
	{
		Shader.SetUniform("Texture",Textures[0]);
		Shader.SetUniform("TextureWidth",Textures[0].GetWidth());
		Shader.SetUniform("LumaTexture",Textures[0]);
		Shader.SetUniform("ChromaTexture",Textures[1]);
		Shader.SetUniform("ChromaUTexture",Textures[1]);
		Shader.SetUniform("ChromaVTexture",Textures[2]);
		Shader.SetUniform("Yuv_8_8_8_Texture",Textures[0]);

		Shader.SetUniform("DepthMax",Params.KinectDepth);
	}
	RenderTarget.DrawQuad(FragShader,SetUniforms);
}



class TCameraWindow
{
	constructor(CameraName)
	{
		Pop.Debug(`new TCameraWindow(${CameraName})`);
		this.CameraFrameCounter = new Pop.FrameCounter(CameraName + " capture");
		this.RenderFrameCounter = new Pop.FrameCounter(CameraName + " render");
		this.H264KbCounter = new Pop.FrameCounter(CameraName + " h264 kb");
		this.H264FrameCounter = new Pop.FrameCounter(CameraName + " h264");
		

		this.DepthTexture = null;
		const LatestOnly = true;
		this.Source = new Pop.Media.Source(CameraName,undefined,LatestOnly);
		this.Encoder = new Pop.Media.H264Encoder(Params.EncodeQuality);

		this.CaptureFrameLoop().catch(Pop.Debug);
		this.EncodeFrameLoop().catch(Pop.Debug);
		this.CreateWindow(CameraName);
	}

	async CaptureFrameLoop()
	{
		Pop.Debug("CaptureFrameLoop");
		while (true)
		{
			const NewFrame = await this.Source.WaitForNextFrame();
			const DepthTexture = NewFrame.Planes[0];
			DepthTexture.SetFormat('Yuv_8_8_8_Ntsc');
			const Time = NewFrame.TimeMs;
			//	gr: this should be a single async, but sometimes takes multiple encodes to get a result...
			this.Encoder.Encode(DepthTexture,Time);
			this.CameraFrameCounter.Add();
			this.DepthTexture = DepthTexture;
		}
	}

	async EncodeFrameLoop()
	{
		Pop.Debug("EncodeFrameLoop");
		while (true)
		{
			const NewH264 = await this.Encoder.GetNextPacket();
			const H264Data = NewH264.Data;
			//Pop.Debug("New H264 frame",NewH264.Time,typeof H264Data);
			this.H264KbCounter.Add(H264Data.length/1024);
			this.H264FrameCounter.Add();
		}
	}

	CreateWindow(WindowName)
	{
		Pop.Debug("CreateWindow");
		function Render(RenderTarget)
		{
			RenderKinect(RenderTarget,this.DepthTexture);
		}
		this.Window = new Pop.Opengl.Window(WindowName);
		this.Window.OnRender = Render.bind(this);
		this.Window.OnMouseMove = function () { };
		this.Window.OnMouseDown = function () { };
		this.Window.OnMouseUp = function () { };
	}
}


let CameraWindows = [];

async function FindCamerasLoop()
{
	let CreateCamera = function (CameraName)
	{
		if (CameraWindows.hasOwnProperty(CameraName))
		{
			Pop.Debug("Already have window for " + CameraName);
			return;
		}

		try
		{
			let Window = new TCameraWindow(CameraName);
			CameraWindows.push(Window);
		}
		catch (e)
		{
			Pop.Debug(e);
		}
	}

	while (true)
	{
		CreateCamera('000396300112');
		return;
		try
		{
			let Devices = await Pop.Media.EnumDevices();
			Pop.Debug("Pop.Media.EnumDevices found(" + Devices + ") result type=" + (typeof Devices));
			//Devices.reverse();
			//CreateCamera(Devices[0]);
			Devices.forEach(CreateCamera);
			await Pop.Yield(1);

			//	todo: EnumDevices needs to change to "OnDevicesChanged"
			break;
		}
		catch (e)
		{
			Pop.Debug("FindCamerasLoop error: " + e);
		}
	}
}

//	start tracking cameras
FindCamerasLoop().catch(Pop.Debug);



