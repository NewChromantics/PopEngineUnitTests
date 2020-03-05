Pop.Include = function (Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun(Source,Filename);
}

const EngineDebug = new Pop.Engine.StatsWindow();

Pop.Include('../PopEngineCommon/PopApi.js');
Pop.Include('../PopEngineCommon/PopMath.js');	//	needed by ParamsWindow
Pop.Include('../PopEngineCommon/ParamsWindow.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');


let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let Uvy844FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv888FragShader = Pop.LoadFileAsString('Yuv8_88.frag.glsl');
let Yuv8_8_8FragShader = Pop.LoadFileAsString('Yuv8_8_8.frag.glsl');
let Yuv8888FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let DepthmmFragShader = Pop.LoadFileAsString('Depthmm.frag.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let UyvyFragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');

//let GetChromaUvy844Shader = Pop.LoadFileAsString('GetChroma_Uvy844.frag.glsl');

const Params = {};
Params.DepthMin = 1;
Params.DepthMax = 4000;
Params.Compression = 8;

const ParamsWindow = new Pop.ParamsWindow(Params);
ParamsWindow.AddParam('DepthMin',0,65500);
ParamsWindow.AddParam('DepthMax',0,65500);
ParamsWindow.AddParam('Compression',0,9,Math.floor);

//	convert a set of textures to YUV_8_8_8 to encode
function GetH264Pixels(Planes)
{
	//	find the depth plane
	function IsDepthPlane(Image)
	{
		return Image.GetFormat() == 'Depth16mm';
	}
	Planes = Planes.filter(IsDepthPlane);
	const DepthPlane = Planes[0];
	const DepthPixels = DepthPlane.GetPixelBuffer();
	const LumaWidth = DepthPlane.GetWidth();
	const LumaHeight = DepthPlane.GetHeight();
	const ChromaWidth = LumaWidth / 2;
	const ChromaHeight = LumaHeight / 2;
	//	convert depth16 to luma
	const YuvSize = (LumaWidth * LumaHeight) + (ChromaWidth * ChromaHeight) + (ChromaWidth * ChromaHeight);
	const Yuv_8_8_8 = new Uint8ClampedArray(YuvSize);
	for (let i = 0;i < DepthPixels.length;i ++ )
	{
		//	convert to u8
		const d = DepthPixels[i];
		let f = Math.Range(Params.DepthMin,Params.DepthMax,d);
		f *= 255;
		Yuv_8_8_8[i] = f;
	}
	const YuvImage = new Pop.Image();
	YuvImage.WritePixels(LumaWidth,LumaHeight,Yuv_8_8_8,'Yuv_8_8_8_Ntsc');
	return YuvImage;
}


function TCameraWindow(CameraName)
{
	this.Textures = [];
	this.CameraFrameCounter = new Pop.FrameCounter(CameraName);
	this.EncodedH264KbCounter = new Pop.FrameCounter(CameraName + " h264 kb");

	this.OnRender = function (RenderTarget)
	{
		if (!this.Source)
		{
			RenderTarget.ClearColour(255,0,0);
			return;
		}

		if (!this.Textures.length)
		{
			RenderTarget.ClearColour(0,0,255);
			return;
		}

		let Texture0 = this.EncodedTexture ? this.EncodedTexture : this.Textures[0];
		let Texture1 = this.Textures[1];
		let Texture2 = this.Textures[2];

		//Pop.Debug(Texture0.GetFormat());
		let ShaderSource = BlitFragShader;

		if (Texture0.GetFormat() == "YYuv_8888_Full")
			ShaderSource = Yuv8888FragShader;
		else if (Texture0.GetFormat() == "YYuv_8888_Ntsc")
			ShaderSource = Yuv8888FragShader;
		else if (Texture0.GetFormat() == "Uvy_844_Full")
			ShaderSource = Uvy844FragShader;
		else if (Texture0.GetFormat() == "Greyscale" && this.Textures.length == 3)
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
			ShaderSource = DepthmmFragShader;
		else if (Texture0.GetFormat() == "Depth16mm")
			ShaderSource = DepthmmFragShader;
		else if (Texture0.GetFormat() == "uyvy")
			ShaderSource = UyvyFragShader;
		else
		{
			let Formats = [];
			this.Textures.forEach(t => Formats.push(t.GetFormat()));
			Pop.Debug("No specific shader for " + Formats.join(','));
		}


		let FragShader = Pop.GetShader(RenderTarget,ShaderSource);

		let SetUniforms = function (Shader)
		{
			Shader.SetUniform("Texture",Texture0);
			Shader.SetUniform("TextureWidth",Texture0.GetWidth());
			Shader.SetUniform("LumaTexture",Texture0);
			Shader.SetUniform("ChromaTexture",Texture1);
			Shader.SetUniform("ChromaUTexture",Texture1);
			Shader.SetUniform("ChromaVTexture",Texture2);
			Shader.SetUniform("Yuv_8_8_8_Texture",Texture0);

			Shader.SetUniform("DepthMin",Params.DepthMin);
			Shader.SetUniform("DepthMax",Params.DepthMax);
		}
		RenderTarget.DrawQuad(FragShader,SetUniforms);
	}

	this.EncodedLoop = async function ()
	{
		//	wait for encoded packets, then send them out
		while (true)
		{
			if (!this.Encoder)
			{
				await Pop.Yield(1000);
				continue;
			}

			//Pop.Debug("Wait for next packet");
			const Packet = await this.Encoder.WaitForNextPacket();
			//Pop.Debug("Got packet x",Packet.Data.length);
			this.EncodedH264KbCounter.Add(Packet.Data.length/1024);
		}
	}

	this.ListenForFrames = async function ()
	{
		while (true)
		{
			try
			{
				const NewFrame = await this.Source.WaitForNextFrame();
				this.Textures = NewFrame.Planes;
				const Time = NewFrame.Time ? NewFrame.Time : Pop.GetTimeNowMs();

				//	remake encoder if compression changes
				if (this.EncoderCompression != Params.Compression)
					this.Encoder = null;

				if (!this.Encoder)
				{
					this.Encoder = new Pop.Media.H264Encoder(Params.Compression);
				}

				this.EncodedTexture = GetH264Pixels(this.Textures);
				this.Encoder.Encode(this.EncodedTexture,Time);
				
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
	this.Window.OnMouseMove = function () { };
	this.Window.OnMouseDown = function () { };
	this.Window.OnMouseUp = function () { };

	const LatestOnly = true;
	const Format = "Depth16";
	//const Format = "Yuv_8_88_Ntsc_Depth16";
	//const Format = "Yuv_8_44_Ntsc_Depth16";
	//	make this a callback!
	this.EncoderCompression = Params.Compression;
	this.Encoder = null;
	this.Source = new Pop.Media.Source(CameraName,Format,LatestOnly);
	this.ListenForFrames().catch(Pop.Debug);
	this.EncodedLoop().catch(Pop.Debug);
	
}


let CameraWindows = [];

async function FindCamerasLoop()
{
	let CreateCamera = function (CameraDevice)
	{
		const CameraName = CameraDevice.Serial;

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
			Pop.Debug("Camera error",e);
		}
	}

	while (true)
	{
		function IsKinectDevice(Device)
		{
			return Device.Serial.includes('KinectAzure');
		}

		try
		{
			let Devices = await Pop.Media.EnumDevices();
			Pop.Debug("Pop.Media.EnumDevices found(" + JSON.stringify(Devices) + ") result type=" + (typeof Devices));
			Devices = Devices.Devices.filter(IsKinectDevice);

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
