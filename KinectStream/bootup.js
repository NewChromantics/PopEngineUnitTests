//	ios specific debug for now
const Ios = {};

Pop.Debug(`Platform is ${Pop.GetPlatform()}`);

if ( Pop.GetPlatform() == "Ios" )
{
	Ios.Window = new Pop.Gui.Window("Any name");
	Ios.DebugLabel = new Pop.Gui.Label(Ios.Window,"TheTextBox");
	Ios.DebugLabel.SetValue('Hello from javascript!');
Ios.DebugLogs = [];
Ios.Pop_Debug = Pop.Debug;
Ios.Debug = function()
{
	Ios.Pop_Debug(...arguments);
	
	const Log = Array.from(arguments).join(',');
	Ios.DebugLogs.splice(0,0,Log);
	const LogString = Ios.DebugLogs.slice(0,40).join('\n');
	Ios.DebugLabel.SetValue(LogString);
}

	//	replace Pop.Debug
	Pop.Debug = Ios.Debug;
}



Pop.Include = function (Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun(Source,Filename);
}


let EngineDebug;
try
{
	EngineDebug = new Pop.Engine.StatsWindow();
}
catch(e)
{
	Pop.Debug('Pop.Engine.StatsWindow:',e);
}


Pop.Include('../PopEngineCommon/PopApi.js');
Pop.Include('../PopEngineCommon/PopMath.js');	//	needed by ParamsWindow
Pop.Include('../PopEngineCommon/ParamsWindow.js');
Pop.Include('../PopEngineCommon/PopTexture.js');
Pop.Include('../PopEngineCommon/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');
Pop.Include('../PopEngineCommon/PopH264.js');


let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let Uvy844FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv8_88FragShader = Pop.LoadFileAsString('Yuv8_88.frag.glsl');
let Yuv8_8_8FragShader = Pop.LoadFileAsString('Yuv8_8_8.frag.glsl');
let Yuv888FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let Yuv8_8_8_OneImageFragShader = Pop.LoadFileAsString('Yuv8_8_8_OneImage.frag.glsl');
let DepthmmFragShader = Pop.LoadFileAsString('Depthmm.frag.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let UyvyFragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');

//let GetChromaUvy844Shader = Pop.LoadFileAsString('GetChroma_Uvy844.frag.glsl');
const BlackTexture = Pop.CreateColourTexture([0,0,0,1]);

const Params = {};
Params.DepthMin = 100;
Params.DepthMax = 4000;
Params.Compression = 3;
Params.ChromaRanges = 6;
Params.PingPongLuma = true;
Params.DepthSquared = true;
Params.WebsocketPort = 8080;

let ParamsWindow;
try
{
	ParamsWindow = new Pop.ParamsWindow(Params);
	ParamsWindow.AddParam('DepthMin',0,65500);
	ParamsWindow.AddParam('DepthMax',0,65500);
	ParamsWindow.AddParam('Compression',0,9,Math.floor);
	ParamsWindow.AddParam('ChromaRanges',1,256,Math.floor);
	ParamsWindow.AddParam('DepthSquared');
	ParamsWindow.AddParam('PingPongLuma');
	ParamsWindow.AddParam('PingPongLuma');
	ParamsWindow.AddParam('WebsocketPort',80,9999,Math.floor);
}
catch(e)
{
	Pop.Debug("ParamsWindow error",e);
	//	make stub
	ParamsWindow = {};
	ParamsWindow.AddParam = function(){};
}


let FrameQueue = [];
let CriticalFrames = [];	//	save SPS/PPS frames for new peers

function OnNewPeer(Peer,Server)
{
	function SendFrame(Frame)
	{
		Server.Send(Peer,JSON.stringify(Frame.Meta));
		Server.Send(Peer,Frame.Data);
	}
	Pop.Debug(`Sending new peer(${Peer}) ${CriticalFrames.length} frames`);
	CriticalFrames.forEach(SendFrame);
}

function QueueFrame(Data,Meta,Keyframe)
{
	const FramePacket = {};
	FramePacket.Meta = Meta;
	FramePacket.Data = Data;
	FramePacket.Keyframe = Keyframe;
	FrameQueue.push(FramePacket);

	if (Pop.H264.IsKeyframe(Data))
		CriticalFrames.push(FramePacket);
}

function PopNextFrameQueueFrame()
{
	function IsKeyframe(Frame)
	{
		return Frame.Keyframe;
	}

	if (FrameQueue.length == 0)
		return null;

	//	try sending first keyframe first
	const FirstKeyframeIndex = FrameQueue.findIndex(IsKeyframe);

	//	if no keyframe, send latest frame
	//const SendFrameIndex = (FirstKeyframeIndex >= 0) ? FirstKeyframeIndex : FrameQueue.length - 1;
	const SendFrameIndex = 0;

	//	delete frames before
	FrameQueue.splice(0,SendFrameIndex);
	Pop.Debug(`Dropped ${SendFrameIndex} queued frames`);
	const Frame = FrameQueue.shift();
	return Frame;
}

async function SendNextFrame(SendFunc)
{
	//	send latest keyframe, or non-keyframe if none
	const Frame = PopNextFrameQueueFrame();
	if (Frame === null)
	{
		await Pop.Yield(20);
		return;
	}

	SendFunc(JSON.stringify(Frame.Meta));
	SendFunc(Frame.Data);
}

async function WebsocketLoop(Ports,OnNewPeer,SendFrameFunc)
{
	let PortIndex = null;
	let ExistingPeers = [];

	while (true)
	{
		PortIndex = (PortIndex === null) ? 0 : PortIndex++;
		PortIndex = PortIndex % Ports.length;
		const Port = Ports[PortIndex]
		const Server = new Pop.Websocket.Server(Port);
		//await Server.WaitForConnect();
		while (true)
		{
			//	wait for at least one peer
			{
				const Peers = Server.GetPeers();
				if (Peers.length == 0)
				{
					await Pop.Yield(500);
					continue;
				}

				//	look for new peers
				const NewPeers = Peers.filter(p => !ExistingPeers.includes(p));
				NewPeers.forEach( p => OnNewPeer(p,Server) );
				ExistingPeers = Peers;
			}

			function Send(Message)
			{
				const Peers = Server.GetPeers();
				function SendToPeer(Peer)
				{
					try
					{
						Server.Send(Peer,Message);
					}
					catch (e)
					{
						Pop.Debug(`SendFrameToPeer(${Peer}) error; ${e}`);
					}
				}
				Peers.forEach(SendToPeer);
			}
			await SendFrameFunc(Send);
		}
	}
}



function GetUvRanges(RangeCount)
{
	//	build a unique-uv table with a total of RangeCount
	let RangeX = Math.sqrt(RangeCount);
	RangeX = Math.ceil(RangeX);
	RangeX = Math.max(1,RangeX);
	//	gr: we could clip this to get closer to original count
	const RangeY = RangeX;

	const Ranges = [];
	const RangeXMax = Math.max(1,RangeX - 1);
	const RangeYMax = Math.max(1,RangeY - 1);
	for (let x = 0;x < RangeX;x++)
	{
		for (let y = 0;y < RangeY;y++)
		{
			const xf = x / RangeXMax;
			const yf = y / RangeYMax;
			Ranges.push([xf,yf]);
		}
	}

	return Ranges;
}

let Wabt = null;
try
{
	Pop.Include('libwabt.js');
	function LoadWabt(Module)
	{
		Pop.Debug('LoadWabt()',Module);
		Wabt = Module;
	}
	//	supposed to be a promise, but no catch... assuming its a promise wrapper
	WabtModule().then(LoadWabt);//.catch(Pop.Debug);
}
catch (e)
{
	Pop.Debug("libwabt error",e);
}


function CompileWasm(WatCode)
{
	//	WAT to wasm compiler ripped from
	//	https://webassembly.github.io/wabt/demo/wat2wasm/
	const Features = { "exceptions": false,"mutable_globals": true,"sat_float_to_int": false,"sign_extension": false,"simd": false,"threads": false,"multi_value": false,"tail_call": false,"bulk_memory": false,"reference_types": false };
	const Module = Wabt.parseWat('test.wast',WatCode,Features);
	Module.resolveNames();
	Module.validate(Features);
	const BinaryOutput = Module.toBinary({ log: true,write_debug_names: true });
	const BinaryArray = BinaryOutput.buffer;
	Pop.Debug(BinaryOutput.log);

	return BinaryArray;
}

const WasmCache = {};

Pop.Wasm = {};

Pop.Wasm.Module = class
{
	constructor()
	{
		this.Module = null;
		this.Instance = null;
		this.UsedBytes = 0;
	}

	GetMemory()
	{
		return this.Instance.exports.memory;
	}

	ResetHeap()
	{
		this.UsedBytes = 0;
	}

	HeapAlloc(Size)
	{
		const Offset = this.UsedBytes;
		this.UsedBytes += Size;

		//	realloc if we need to
		const NewBytesUsed = this.UsedBytes;

		const Memory = this.GetMemory();
		const MaxBytes = Memory.buffer.byteLength;
		if (NewBytesUsed > MaxBytes)
		{
			const PageSize = 64 * 1024;
			const NewPages = Math.ceil((NewBytesUsed - MaxBytes) / PageSize);
			Pop.Debug(`Reallocating heap in WASM module ${NewBytesUsed} > ${MaxBytes}. New Pages x${NewPages}`);
			Memory.grow(NewPages);
			Pop.Debug(`New WASM module heap size ${Memory.buffer.byteLength}`);
		}

		return Offset;
	}

	HeapAllocArray(ArrayType,Length)
	{
		const ElementSize = ArrayType.BYTES_PER_ELEMENT;
		const ByteOffset = this.HeapAlloc(Length * ElementSize);
		const Memory = this.GetMemory();
		return new ArrayType(Memory.buffer,ByteOffset,Length);
	}
}

function GetWasmModule(WatFilename)
{
	if (WasmCache.hasOwnProperty(WatFilename))
	{
		WasmCache[WatFilename].ResetHeap();
		return WasmCache[WatFilename];
	}

	const PageSize = 64 * 1024;
	function BytesToPages(Bytes)
	{
		return Math.ceil(Bytes / PageSize);
	}

	let WasmCode;

	//	get source and compile it to wasm
	const WasmFilename = WatFilename.replace('.wat','.wasm');
	if (Pop.FileExists(WasmFilename))
	{
		Pop.Debug("Using cached/precompiled WASM",WasmFilename);
		WasmCode = Pop.LoadFileAsArrayBuffer(WasmFilename);
	}
	else
	{
		const WatCode = Pop.LoadFileAsString(WatFilename);
		WasmCode = CompileWasm(WatCode);
	}
	let WasmImports = {};

	/*	gr: not sure this is having any effect, can't get constructor right?
	const MaxPages = BytesToPages(64 * 1024 * 1024);
	const InitialPages = MaxPages;
	Pop.Debug(`Allocating ${MaxSizeBytes / 1024 / 1024}mb`);
	const Memory = new WebAssembly.Memory({ initial: InitialPages,maximum: MaxPages });
	Pop.Debug("WASM instance memory buffer:",Memory.buffer.byteLength);
	Pop.Debug("WASM instance memory buffer maximum:",Memory.maximum);

	WasmImports.env = {};
	WasmImports.env.memory = Memory;
	*/
	const Wasm = new Pop.Wasm.Module();
	Wasm.Module = new WebAssembly.Module(WasmCode);
	Wasm.Instance = new WebAssembly.Instance(Wasm.Module,WasmImports);

	//Pop.Debug("REAL WASM instance memory buffer:",Wasm.Instance.exports.memory.buffer.byteLength);

	WasmCache[WatFilename] = Wasm;
	return Wasm;
}



//DepthPixels,DepthWidth,DepthHeight,Ranges
function Depth16ToYuv_Wasm(Depth16Plane,DepthWidth,DepthHeight,DepthMin,DepthMax,UvRanges)
{
	const TimerStart = Pop.GetTimeNowMs();
	const WasmModule = GetWasmModule('PopDepthToYuv/Depth16ToYuv.wat');

	const LumaWidth = DepthWidth;
	const LumaHeight = DepthHeight;
	const LumaSize = LumaWidth * LumaHeight;
	const ChromaWidth = Math.floor(LumaWidth / 2);
	const ChromaHeight = Math.floor(LumaHeight / 2);
	const ChromaSize = ChromaWidth * ChromaHeight;
	const YuvSize = LumaSize + ChromaSize + ChromaSize;

	const w = DepthWidth;
	const h = DepthHeight;
	const Depth16 = WasmModule.HeapAllocArray(Uint16Array,w * h);
	const Yuv8_8_8 = WasmModule.HeapAllocArray(Uint8Array,YuvSize);
	Depth16.set(Depth16Plane,0,Depth16Plane.length);

	//void Depth16ToYuv(uint16_t * Depth16Plane,uint8_t * Yuv8_8_8Plane,int Width,int Height,int DepthMin,int DepthMax)

	//	this can throw first time if HeapAlloc resizes
	WasmModule.Instance.exports.Depth16ToYuv(Depth16.byteOffset,Yuv8_8_8.byteOffset,w,h,DepthMin,DepthMax);
	
	//Pop.Debug(Depth16);
	//Pop.Debug(Yuv8_8_8);
	//	if we don't copy, we get some memory access error... but why the module still exists...
	const YuvCopy = new Uint8Array(Yuv8_8_8);

	const TimerEnd = Pop.GetTimeNowMs();
	Pop.Debug(`Wasm took ${TimerEnd - TimerStart}ms`);
	return YuvCopy;
//log(new Uint8Array(wasmMemory.buffer));
	//return Depth8Plane;
}

//Pop.Include('../PopEngineCommon/PopDll.js');
let Depth16ToYuvDll = null;
let Depth16ToYuvDll_Functor = null;
function GetDepth16ToYuvDllFunction()
{
	if (Depth16ToYuvDll_Functor)
		return Depth16ToYuvDll_Functor;

/*
	Depth16ToYuvDll = new Pop.Dll.Library('PopDepthToYuv/Depth16ToYuv.dll');
	//const FunctionDeclaration = "void Depth16ToYuv(uint16_t* Depth16Plane, uint8_t* Yuv8_8_8Plane, int Width, int Height, int DepthMin, int DepthMax);";
	const FunctionDeclaration = "void Depth16ToYuv(uint16_t* Depth16Plane, uint8_t* Yuv8_8_8Plane, int32_t Width, int32_t Height, int32_t DepthMin, int32_t DepthMax);";
	Pop.Debug("FunctionDeclaration",FunctionDeclaration);
	//	gr: this is throwing, but no error!?
	Depth16ToYuvDll_Functor = Depth16ToYuvDll.GetFunctionFromDeclaration(FunctionDeclaration);
	return Depth16ToYuvDll_Functor;
 */
	throw "Not supported";
}

function Depth16ToYuv_Dll(Depth16Plane,DepthWidth,DepthHeight,DepthMin,DepthMax,UvRanges)
{
	const TimerStart = Pop.GetTimeNowMs();
	const Functor = GetDepth16ToYuvDllFunction();
	const LumaWidth = DepthWidth;
	const LumaHeight = DepthHeight;
	const LumaSize = LumaWidth * LumaHeight;
	const ChromaWidth = Math.floor(LumaWidth / 2);
	const ChromaHeight = Math.floor(LumaHeight / 2);
	const ChromaSize = ChromaWidth * ChromaHeight;
	const YuvSize = LumaSize + ChromaSize + ChromaSize;

	const Yuv8_8_8 = new Uint8Array(YuvSize);

	Functor(Depth16Plane,Yuv8_8_8,DepthWidth,DepthHeight,DepthMin,DepthMax);

	//Pop.Debug(Depth16Plane);
	//Pop.Debug(Yuv8_8_8);

	const TimerEnd = Pop.GetTimeNowMs();
	Pop.Debug(`DLL took ${TimerEnd - TimerStart}ms`);
	return Yuv8_8_8;
}


function Depth16ToYuv_Js(Depth16Plane,DepthWidth,DepthHeight,DepthMin,DepthMax,UvRanges)
{
	const DepthPixels = Depth16Plane;
	const LumaWidth = DepthWidth;
	const LumaHeight = DepthHeight;

	const ChromaWidth = Math.floor(LumaWidth / 2);
	const ChromaHeight = Math.floor(LumaHeight / 2);
	const ChromaSize = ChromaWidth * ChromaHeight;

	const YuvSize = (LumaWidth * LumaHeight) + ChromaSize + ChromaSize;
	const Yuv_8_8_8 = new Uint8ClampedArray(YuvSize);
	function GetChromaIndex(Depthx,Depthy)
	{
		//	this is more complicated than one would assume
		//	we need the TEXTURE BUFFER index we're writing to;
		//	each TEXTURE row is 2x pixel rows as the chroma width is half, but
		//	the luma width is the same, so chroma buffer looks like this
		//	ROW1ROW2
		//	ROW3ROW4
		const ChromaX = Math.floor(Depthx / 2);
		const ChromaY = Math.floor(Depthy / 2);
		const Left = (ChromaY % 2) == 0;

		const WriteX = Left ? ChromaX : ChromaX + ChromaWidth;
		const WriteY = Math.floor(ChromaY / 2);

		const WriteIndex = WriteX + (WriteY * LumaWidth);
		return WriteIndex;
	}

	const RangeLengthMin1 = Math.max(1,UvRanges.length - 1);
	//Pop.Debug(JSON.stringify(UvRanges));

	for (let i = 0;i < DepthPixels.length;i++)
	{
		/*	test speed
		const f = i / DepthPixels.length;
		Yuv_8_8_8[i] = f * 255;
		continue;
		*/
		const x = Math.floor(i % LumaWidth);
		const y = Math.floor(i / LumaWidth);

		//	write indexes one 1byte planes
		const LumaIndex = i;
		const ChromaIndex = GetChromaIndex(x,y);
		const ChromaUIndex = (LumaWidth * LumaHeight) + ChromaIndex;
		const ChromaVIndex = (LumaWidth * LumaHeight) + ChromaSize + ChromaIndex;

		const Depth = DepthPixels[i];
		let Depthf = Math.RangeClamped(DepthMin,DepthMax,Depth);

		if (Params.DepthSquared)
		{
			Depthf = 1 - Depthf;
			Depthf *= Depthf;
			Depthf = 1 - Depthf;
		}

		const DepthScaled = Depthf * RangeLengthMin1;
		let RangeIndex = Math.floor(DepthScaled);
		let Remain = DepthScaled - RangeIndex;
		RangeIndex = Math.min(RangeIndex,RangeLengthMin1);
		//Pop.Debug(Depthf,Remain,RangeIndex);
		//continue;

		//	make luma go 0-1 1-0 0-1 so luma image wont have edges for compression
		if (Params.PingPongLuma)
			if (RangeIndex & 1)
				Remain = 1 - Remain;

		const Rangeuv = UvRanges[RangeIndex];
		const Luma = Remain;
		//const Luma = Depthf;
		//const Luma = RangeIndex / Ranges.length;

		Yuv_8_8_8[LumaIndex] = Luma * 255;
		Yuv_8_8_8[ChromaUIndex] = Rangeuv[0] * 255;
		Yuv_8_8_8[ChromaVIndex] = Rangeuv[1] * 255;
		//if (ChromaUIndex > Yuv_8_8_8.length || ChromaVIndex > Yuv_8_8_8.length)
		//	Pop.Debug(`Out of range; ${ChromaUIndex} ${ChromaVIndex} ${Yuv_8_8_8.length}`);
	}

	return Yuv_8_8_8;
}



//	convert a set of textures to YUV_8_8_8 to encode
function GetH264Pixels(Planes)
{
	//	find the depth plane
	function IsDepthPlane(Image)
	{
		return Image.GetFormat() == 'Depth16mm';
	}
	Planes = Planes.filter(IsDepthPlane);
	if ( !Planes.length )
	{
		Pop.Debug("No depth plane", Planes.map(p=>p.GetFormat()).join(',') );
		return;
	}
	const DepthPlane = Planes[0];
	const DepthPixels = DepthPlane.GetPixelBuffer();
	const DepthWidth = DepthPlane.GetWidth();
	const DepthHeight = DepthPlane.GetHeight();

	const Ranges = GetUvRanges(Params.ChromaRanges);

	let Yuv_8_8_8;
	//const Funcs = { Dll: Depth16ToYuv_Dll,Wasm: Depth16ToYuv_Wasm,Js: Depth16ToYuv_Js };
	const Funcs = { Js: Depth16ToYuv_Js };
	for (const FuncName in Funcs)
	{
		const Func = Funcs[FuncName];
		try
		{
			Yuv_8_8_8 = Func(DepthPixels,DepthWidth,DepthHeight,Params.DepthMin,Params.DepthMax,Ranges);
			break;
		}
		catch (e)
		{
			Pop.Debug(`${FuncName} error; ${e}`);
		}
	}

	const YuvImage = new Pop.Image();
	YuvImage.WritePixels(DepthWidth,DepthHeight,Yuv_8_8_8,'Yuv_8_8_8_Ntsc');
	YuvImage.SetLinearFilter(false);
	return YuvImage;
}

function RenderImage(RenderTarget,Textures,Rect)
{
	if (!Textures)
	{
		//RenderTarget.ClearColour(255,0,0);
		return;
	}

	if (!Textures.length)
	{
		//RenderTarget.ClearColour(0,0,255);
		return;
	}

	let Texture0 = Textures[0];
	let Texture1 = Textures[1];
	let Texture2 = Textures[2];
	if (!Texture1) Texture1 = BlackTexture;
	if (!Texture2) Texture2 = BlackTexture;


	//Pop.Debug("Texture0.GetFormat()=",Texture0.GetFormat(),"x",this.Textures.length);
	let ShaderSource = BlitFragShader;

	if (Texture0.GetFormat() == "YYuv_8888_Full")
		ShaderSource = Yuv8888FragShader;
	else if (Texture0.GetFormat() == "YYuv_8888_Ntsc")
		ShaderSource = Yuv8888FragShader;
	else if (Texture0.GetFormat() == "Uvy_844_Full")
		ShaderSource = Uvy844FragShader;
	else if (Texture0.GetFormat() == "Greyscale" && Textures.length == 3)
		ShaderSource = Yuv8_8_8FragShader;
	else if (Texture0.GetFormat() == "RGBA")
		ShaderSource = BlitFragShader;
	else if (Texture0.GetFormat() == "Greyscale")
		ShaderSource = BlitFragShader;
	else if (Texture0.GetFormat() == "Yuv_8_8_8_Full" && Textures.length == 1)
		ShaderSource = Yuv8_8_8_OneImageFragShader;
	else if (Texture0.GetFormat() == "Yuv_8_8_8_Ntsc" && Textures.length == 1)
		ShaderSource = Yuv8_8_8_OneImageFragShader;
	else if (Texture0.GetFormat() == "Yuv_8_8_8_Full")
		ShaderSource = Yuv8888FragShader;
	else if (Texture0.GetFormat() == "Yuv_8_8_8_Ntsc")
		ShaderSource = Yuv8888FragShader;
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

	let FragShader = Pop.GetShader(RenderTarget,ShaderSource,VertShader);

	let SetUniforms = function (Shader)
	{
		Shader.SetUniform("VertexRect",Rect);
		Shader.SetUniform("Texture",Texture0);
		Shader.SetUniform("TextureWidth",Texture0.GetWidth());
		Shader.SetUniform("TextureHeight",Texture0.GetHeight());
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


function TCameraWindow(CameraName)
{
	this.VideoTextures = [];
	this.EncodedTextures = [];
	this.DecodedTextures = [];
	this.CameraFrameCounter = new Pop.FrameCounter(CameraName);
	this.EncodedH264Counter = new Pop.FrameCounter(CameraName + " h264");
	this.EncodedH264KbCounter = new Pop.FrameCounter(CameraName + " h264 kb");
	this.DecodedH264Counter = new Pop.FrameCounter(CameraName + " H264 Decoded");

	this.OnRender = function (RenderTarget)
	{
		RenderImage(RenderTarget,this.VideoTextures,	[0.00,0,0.33,1]);
		RenderImage(RenderTarget,this.EncodedTextures,	[0.33,0,0.33,1]);
		RenderImage(RenderTarget,this.DecodedTextures,	[0.66,0,0.33,1]);
	}

	this.DecodeLoop = async function ()
	{
		while (true)
		{
			Pop.Debug("Wait for next decoder packet");

			const Frame = await this.Decoder.WaitForNextFrame();
			this.DecodedTextures = Frame.Planes;
			this.DecodedH264Counter.Add();
			Pop.Debug("Decoded h264 frame",JSON.stringify(Frame));
		}
	}

	this.EncodedLoop = async function ()
	{
		//	wait for encoded packets, then send them out
		while (true)
		{
			if (!this.Encoder)
			{
				Pop.Debug("Waiting for encoder");
				await Pop.Yield(200);
				continue;
			}

			Pop.Debug("Wait for next encoder packet");
			let Packet;
			try
			{
				Packet = await this.Encoder.WaitForNextPacket();
			}
			catch(e)
			{
				Pop.Debug(`Exception waiting for packet ${e} - race condition in engine?`);
				continue;
			}
			Pop.Debug("Got packet x",Packet.Data.length);
			this.EncodedH264KbCounter.Add(Packet.Data.length/1024);
			this.EncodedH264Counter.Add();

			const Meta = {};
			Meta.Time = Packet.Time;
			const IsKeyframe = Pop.H264.IsKeyframe(Packet.Data);

			//	send out packet
			Pop.Debug("H264 packet is keyframe;",IsKeyframe,"x" + Packet.Data.length);
			QueueFrame(Packet.Data,Meta,IsKeyframe);

			//	queue for re-decode for testing
			Pop.Debug("Decode h264 packet...");
			this.Decoder.Decode(Packet.Data);
		}
	}

	this.ListenForFrames = async function ()
	{
		while (true)
		{
			try
			{
				const NewFrame = await this.Source.WaitForNextFrame();
				this.VideoTextures = NewFrame.Planes;
				this.CameraFrameCounter.Add();

				const Time = NewFrame.Time ? NewFrame.Time : Pop.GetTimeNowMs();

				//	remake encoder if compression changes
				if (this.EncoderCompression != Params.Compression)
					this.Encoder = null;

				if (!this.Encoder)
				{
					Pop.Debug("New encoder",Params.Compression);
					this.Encoder = new Pop.Media.H264Encoder(Params.Compression);
					this.EncoderCompression = Params.Compression;
				}

				const EncodedTexture = GetH264Pixels(this.VideoTextures);
				if ( EncodedTexture )
				{
					this.EncodedTextures = [EncodedTexture];
					this.Encoder.Encode(EncodedTexture,Time);
				}
				
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

	try
	{
		this.Window = new Pop.Opengl.Window(CameraName);
		this.Window.OnRender = this.OnRender.bind(this);
		this.Window.OnMouseMove = function () { };
		this.Window.OnMouseDown = function () { };
		this.Window.OnMouseUp = function () { };
	}
	catch(e)
	{
		Pop.Debug(e);
	}
	
	const LatestOnly = true;
	const Format = "Depth16";
	//const Format = "Yuv_8_88_Ntsc_Depth16";
	//const Format = "Yuv_8_44_Ntsc_Depth16";
	//	make this a callback!
	this.EncoderCompression = Params.Compression;
	this.Encoder = null;
	this.Source = new Pop.Media.Source(CameraName,Format,LatestOnly);
	this.Decoder = new Pop.Media.AvcDecoder();
	this.ListenForFrames().catch(Pop.Debug);
	this.EncodedLoop().catch(function (e) { Pop.Debug("Encode loop exception",e); });
	this.DecodeLoop().catch(function (e) { Pop.Debug("Decode loop exception",e); });
	
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
			//	testing
			if ( Device.Serial.includes('Back') )
				return true;
			if ( Device.Serial.includes('FaceTime') )
				return true;

			if ( Device.Serial.includes('KinectAzure') )
				return true;

			if ( Device.Serial.startsWith('Freenect') )
				if ( Device.Serial.endsWith('_Depth') )
					return true;
			
			return false;
		}

		try
		{
			let Devices = await Pop.Media.EnumDevices();
			Pop.Debug("Pop.Media.EnumDevices found(" + JSON.stringify(Devices) + ") result type=" + (typeof Devices));
			Devices = Devices.Devices.filter(IsKinectDevice);

			Devices.forEach(CreateCamera);

			//	todo: EnumDevices needs to change to "OnDevicesChanged"
			break;
		}
		catch (e)
		{
			Pop.Debug("FindCamerasLoop error: " + e);
		}
		await Pop.Yield(10*1000);
	}
}

Pop.Debug("Hello");

//	start tracking cameras
FindCamerasLoop().catch(Pop.Debug);

const Ports = [Params.WebsocketPort];
WebsocketLoop(Ports,OnNewPeer,SendNextFrame).then(Pop.Debug).catch(Pop.Debug);
