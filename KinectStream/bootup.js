//	ios specific debug for now
const Ios = {};

Pop.Debug(`Platform is ${Pop.GetPlatform()}`);

let OnSocketReady = function(Name,Socket)
{
	const Address = Socket ? Socket.GetAddress().map( a => a.Address ).join(',') : "";
	Pop.Debug(`Socket Ready: ${Name}@ ${Address}`);
}

if ( Pop.GetPlatform() == "Ios" )
{
	try
	{
		Ios.Window = new Pop.Gui.Window("Any name");
		Ios.DebugLabel = new Pop.Gui.Label(Ios.Window,"Debug");
		Ios.ServerLabel = new Pop.Gui.Label(Ios.Window,"Servers");
		Ios.StatsLabel = new Pop.Gui.Label(Ios.Window,"Stats");
		Ios.DebugLabel.SetValue('Hello from javascript!');
		Ios.DebugLogs = [];
		Ios.Pop_Debug = Pop.Debug;
		Ios.Debug = function()
		{
			//Ios.Pop_Debug(...arguments);
			
			const Log = Array.from(arguments).join(',');
			Ios.DebugLogs.splice(0,0,Log);
		const LogString = Ios.DebugLogs.slice(0,40).join('\n');
		Ios.DebugLabel.SetValue(LogString);
	}

	//	replace Pop.Debug
	Pop.Debug = Ios.Debug;
	
	let SocketDebugs = [];
	OnSocketReady = function(Name,Socket)
	{
		const Address = Socket ? Socket.GetAddress().map( a => a.Address ).join(',') : "";
		const Debug = `Socket Ready: ${Name}@ ${Address}`;
		Pop.Debug(Debug);
			SocketDebugs.push(Debug);
			Ios.ServerLabel.SetValue(SocketDebugs.join('\n'));
		}
	}
	catch(e)
	{
		Pop.Debug(`IOS error: ${e}`);
	}
}



Pop.Include = function (Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun(Source,Filename);
}


let EngineDebug;
try
{
	//EngineDebug = new Pop.Engine.StatsWindow( Ios ? Ios.StatsLabel : undefined );
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
let Uvy844_FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv8_88_OneImage_FragShader = Pop.LoadFileAsString('Yuv8_88_OneImage.frag.glsl');
let Yuv8_88_TwoImage_FragShader = Pop.LoadFileAsString('Yuv8_88_TwoImage.frag.glsl');
let Yuv8_8_8_FragShader = Pop.LoadFileAsString('Yuv8_8_8.frag.glsl');
let Yuv888_FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let Yuv8_8_8_OneImage_FragShader = Pop.LoadFileAsString('Yuv8_8_8_OneImage.frag.glsl');
let Depthmm_FragShader = Pop.LoadFileAsString('Depthmm.frag.glsl');
let Blit_FragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let Uyvy_FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');

//let GetChromaUvy844Shader = Pop.LoadFileAsString('GetChroma_Uvy844.frag.glsl');
const BlackTexture = Pop.CreateColourTexture([0,0,0,1]);

const EncoderParamPrefix = 'Encode_';
const Params = {};
Params.DepthMin = 100;
Params.DepthMax = 4000;
Params.ChromaRanges = 6*6;
Params.PingPongLuma = true;
Params.DepthSquared = true;
Params.WebsocketPort = 8080;
Params.UdpHost = '192.168.0.11';
//Params.UdpHost = '127.0.0.1';
Params.UdpPort = 1234;
Params.TcpHost = '192.168.0.11';
//Params.TcpHost = '127.0.0.1';
Params.TcpPort = 1235;
Params.EnableDecoding = true;
Params.EnableDecodingOnlyKeyframes = true;
Params.KeyframeEveryNFrames = 999;
Params.ShowRawYuv = false;
Params.TestDepthToYuv8_88 = true;
Params.RecordH264ToFile = false;


Params.Encode_Quality = 1;
Params.Encode_AverageKbps = 900;
Params.Encode_MaxKbps = 0;
Params.Encode_Realtime = true;
Params.Encode_MaximisePowerEfficiency = true;
Params.Encode_MaxSliceBytes = 0;
Params.Encode_MaxFrameBuffers = 0;
Params.Encode_ProfileLevel = 32;

Params.Encode_EncoderThreads = 5;
Params.Encode_LookaheadThreads = 5;
Params.Encode_BSlicedThreads = 5;
Params.Encode_VerboseDebug = true;
Params.Encode_Deterministic = false;
Params.Encode_CpuOptimisations = true;



let ParamsWindow;
function OnParamsChanged(Params,Key)
{
	Pop.Debug(`${Key} changed`);
}
try
{
	ParamsWindow = new Pop.ParamsWindow(Params,OnParamsChanged);
	ParamsWindow.AddParam('DepthMin',0,65500);
	ParamsWindow.AddParam('DepthMax',0,65500);
	ParamsWindow.AddParam('ChromaRanges',1,256,Math.floor);
	ParamsWindow.AddParam('DepthSquared');
	ParamsWindow.AddParam('PingPongLuma');
	ParamsWindow.AddParam('WebsocketPort',80,9999,Math.floor);
	ParamsWindow.AddParam('UdpHost');
	ParamsWindow.AddParam('UdpPort',80,9999,Math.floor);
	ParamsWindow.AddParam('EnableDecoding');
	ParamsWindow.AddParam('EnableDecodingOnlyKeyframes');
	ParamsWindow.AddParam('KeyframeEveryNFrames',1,1000,Math.floor);
	ParamsWindow.AddParam('ShowRawYuv');
	ParamsWindow.AddParam('TestDepthToYuv8_88');
	ParamsWindow.AddParam('RecordH264ToFile');
	
	
	ParamsWindow.AddParam('Encode_Quality',0,9,Math.floor);
	ParamsWindow.AddParam('Encode_AverageKbps',0,5000,Math.floor);
	ParamsWindow.AddParam('Encode_Realtime');
	ParamsWindow.AddParam('Encode_MaximisePowerEfficiency');
	ParamsWindow.AddParam('Encode_MaxFrameBuffers',0,20,Math.floor);
	ParamsWindow.AddParam('Encode_MaxSliceBytes',0,1024,Math.floor);
	
}
catch(e)
{
	Pop.Debug("ParamsWindow error",e);
	//	make stub
	ParamsWindow = {};
	ParamsWindow.AddParam = function(){};
}

function GetEncoderParams()
{
	const EncoderKeys = Object.keys(Params).filter( Key => Key.startsWith(EncoderParamPrefix) );
	const EncoderParams = {};
	function SetParam(ParamName)
	{
		const EncoderKeyName = ParamName.substring(EncoderParamPrefix.length);
		EncoderParams[EncoderKeyName] = Params[ParamName];
	}
	EncoderKeys.forEach(SetParam);
	return EncoderParams;
}


let RecordH264Filename = null;
function GetRecordH264Filename(CameraName)
{
	if ( !RecordH264Filename )
	{
		RecordH264Filename = CameraName;

		const Now = Date.now();
		/* now is just a timestamp in javascript core
		const y = Now.getFullYear();
		const m = Now.getMonth();
		const d = Now.getDate();
		const h = Now.getHours();
		const n = Now.getMinutes();
		RecordH264Filename += `${y}-${m}-${d}-${h}-${n}`;*/
		RecordH264Filename += '_' + Now;
		RecordH264Filename += '.h264';
		
		//	todo: API should do friendly filename fixer
		RecordH264Filename = RecordH264Filename.replace(':','_');
		//Pop.ShowFileInFinder(RecordH264Filename);
		Pop.Debug("Recording to "+RecordH264Filename);
	}
	return RecordH264Filename;
}



let FrameQueue = [];
//	save critical packets for new peers
let LastSpsPackets = [];
let LastPpsPackets = [];
let LastKeyFramePackets = [];
function GetCriticalFrames()
{
	if ( !LastSpsPackets.length )
		return [];
	
	//	clip arrays on use
	LastSpsPackets = LastSpsPackets.slice(-1);
	LastPpsPackets = LastPpsPackets.slice(-1);
	LastKeyFramePackets = LastKeyFramePackets.slice(-1);

	const Critical = [ LastSpsPackets[0], LastPpsPackets[0], LastKeyFramePackets[0] ];
	return Critical;
}

function OnNewPeer(Peer,Server)
{
	function SendFrame(Frame)
	{
		Server.Send(Peer,JSON.stringify(Frame.Meta));
		Server.Send(Peer,Frame.Data);
	}
	const CriticalFrames = GetCriticalFrames();
	Pop.Debug(`Sending new peer(${Peer}) ${CriticalFrames.length} frames`);
	CriticalFrames.forEach(SendFrame);
}

function QueueFrame(Data,Meta,Keyframe,CameraName)
{
	const FramePacket = {};
	FramePacket.Meta = Meta;
	FramePacket.Data = Data;
	FramePacket.Keyframe = Keyframe;
	FrameQueue.push(FramePacket);

	if ( Params.RecordH264ToFile )
	{
		//	gr: do we want something more sophisticated for streaming?
		//		buffer up? do it in the api? keep a file handle open?
		const Filename = GetRecordH264Filename(CameraName);
		const Append = true;
		Pop.WriteToFile( Filename, FramePacket.Data, Append );
	}
	
	const Type = Pop.H264.GetNaluType(Data);
	//Pop.Debug(`QueueFrame Type=${Type} Keyframe=${Keyframe}`);
	if ( Type == Pop.H264.SPS )	LastSpsPackets.push(FramePacket);
	if ( Type == Pop.H264.PPS )	LastPpsPackets.push(FramePacket);
	if ( Type == Pop.H264.Slice_CodedIDRPicture )	LastKeyFramePackets.push(FramePacket);
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
	if ( SendFrameIndex > 0 )
	{
		FrameQueue.splice(0,SendFrameIndex);
		Pop.Debug(`Dropped ${SendFrameIndex} queued frames`);
	}
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
		OnSocketReady("WebsocketServer",Server);
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


async function UdpClientSocketLoop(Hosts,OnNewPeer,SendFrameFunc)
{
	let HostIndex = null;
	
	while (true)
	{
		async function Iteration(Host)
		{
			const Socket = new Pop.Socket.UdpClient(Host[0],Host[1]);
			//Pop.Debug("Opened UDP client",JSON.stringify(Socket.GetAddress()));
			OnSocketReady("UdpClient",Socket);
			OnSocketReady(`UdpClient connecting to ${Host[0]}:${Host[1]}`,null);
			
			await Socket.WaitForConnect();
			{
				const Peer = Socket.GetPeers()[0];
				OnNewPeer(Peer,Socket);
			}
			while (true)
			{
				const Peers = Socket.GetPeers();
				if (Peers.length == 0)
					throw "Whilst connected, peers have gone (bug in engine, socket should have disconnected)";
				
				function Send(Message)
				{
					//	todo: convert to an NALU meta packet, or fix client to detect a JSON string
					if (typeof Message == 'string')
						return;

					function SendToPeer(Peer)
					{
						try
						{
							Socket.Send(Peer,Message);
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

		try
		{
			HostIndex = (HostIndex === null) ? 0 : HostIndex++;
			HostIndex = HostIndex % Hosts.length;
			const Host = Hosts[HostIndex];
			const IterationFinished = await Iteration(Host);
			return IterationFinished;
		}
		catch (e)
		{
			Pop.Debug(`UDP socket error ${e}`);
			await Pop.Yield(1000);
		}
	}
}


async function TcpClientSocketLoop(Hosts,OnNewPeer,SendFrameFunc)
{
	let HostIndex = null;

	while (true)
	{
		async function Iteration(Host)
		{
			const Socket = new Pop.Socket.TcpClient(Host[0],Host[1]);
			//Pop.Debug("Opened UDP client",JSON.stringify(Socket.GetAddress()));
			OnSocketReady(`TcpClient connecting to ${Host[0]}:${Host[1]}`,null);

			await Socket.WaitForConnect();
			{
				const Peer = Socket.GetPeers()[0];
				OnNewPeer(Peer,Socket);
			}
			while (true)
			{
				const Peers = Socket.GetPeers();
				if (Peers.length == 0)
					throw "Whilst connected, peers have gone (bug in engine, socket should have disconnected)";

				function Send(Message)
				{
					//	todo: convert to an NALU meta packet, or fix client to detect a JSON string
					if (typeof Message == 'string')
						return;

					function SendToPeer(Peer)
					{
						try
						{
							Socket.Send(Peer,Message);
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

		try
		{
			HostIndex = (HostIndex === null) ? 0 : HostIndex++;
			HostIndex = HostIndex % Hosts.length;
			const Host = Hosts[HostIndex];
			const IterationFinished = await Iteration(Host);
			return IterationFinished;
		}
		catch (e)
		{
			Pop.Debug(`TCP socket error ${e}`);
			await Pop.Yield(1000);
		}
	}
}

function GetUvRanges(RangeCount)
{
	if (RangeCount <= 1)
		return [0.5,0.5];

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





function GetYuv_8_8_8(Planes)
{
	if ( Planes[0].GetFormat().startsWith('Yuv_8_8_8') )
		return Planes[0];

	let Luma = Planes[0];
	//	much faster for testing
	//Luma.SetFormat('Yuv_8_8_8');
	Luma.SetFormat('Greyscale');
	return Luma;
}

function GetTinyTestH264()
{
	let LumaWidth = 50;
	let LumaHeight = 50;
	const ChromaWidth = Math.floor(LumaWidth / 2);
	const ChromaHeight = Math.floor(LumaHeight / 2);
	const ChromaSize = ChromaWidth * ChromaHeight;
	const YuvSize = (LumaWidth * LumaHeight) + ChromaSize + ChromaSize;
	const Yuv_8_8_8 = new Uint8ClampedArray(YuvSize);
	const YuvImage = new Pop.Image();
	YuvImage.WritePixels(LumaWidth,LumaHeight,Yuv_8_8_8,'Yuv_8_8_8');
	return YuvImage;
}

//	convert a set of textures to YUV_8_8_8 to encode
function GetH264Pixels(OrigPlanes)
{
	//return GetTinyTestH264();
	
	//	find the depth plane
	function IsDepthPlane(Image,Index)
	{
		//Pop.Debug(`Depth plane ${Index} is ${Image.GetFormat()}`);
		return Image.GetFormat() == 'Depth16mm';
	}
	let Planes = OrigPlanes.filter(IsDepthPlane);

	if ( !Planes.length )
	{
		//Pop.Debug("No depth plane", Planes.map(p=>p.GetFormat()).join(',') );
		const Img = GetYuv_8_8_8(OrigPlanes);
		return Img;
	}
	const DepthPlane = Planes[0];
	const DepthPixels = DepthPlane.GetPixelBuffer();
	const DepthWidth = DepthPlane.GetWidth();
	const DepthHeight = DepthPlane.GetHeight();

	const Ranges = GetUvRanges(Params.ChromaRanges);


	if (Params.TestDepthToYuv8_88)
	{
		const Yuv = Pop.Opencv.TestDepthToYuv8_88(DepthPlane,Params.DepthMin,Params.DepthMax,Params.ChromaRanges);
		return Yuv;
	}

	//if (Params.TestDepthToYuv8_8_8)
	{
		const Yuv_8_8_8 = Pop.Opencv.TestDepthToYuv8_8_8(DepthPlane,Params.DepthMin,Params.DepthMax,Params.ChromaRanges);
		return Yuv_8_8_8;
	}


	
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
	YuvImage.WritePixels(DepthWidth,DepthHeight,Yuv_8_8_8,'Yuv_8_8_8');
	YuvImage.SetLinearFilter(false);
	return YuvImage;
}

function GetShaderForTextures(Textures)
{
	const Format0 = Textures[0].GetFormat();
	//Pop.Debug(`Format=${Format0} x${Textures.length}`);
	switch(Format0)
	{
		//	special cases
		case "Luma":
		case "Greyscale":
			if ( Textures.length == 3)
				return Yuv8_8_8_FragShader;
			if ( Textures.length == 2)
				return Yuv8_88_TwoImage_FragShader;
			return Blit_FragShader;

		case "Yuv_8_8_8":
			if (Textures.length == 1)
				return Yuv8_8_8_OneImage_FragShader;
			return Blit_FragShader;

		case "Yuv_8_88":
			if (Textures.length == 1)
				return Yuv8_88_OneImage_FragShader;
			return Yuv8_88_FragShader;

		case "YYuv_8888":		return Yuv8888_FragShader;
		case "Yuv_8_8_8":		return Yuv8888_FragShader;
		case "Uvy_844":			return Uvy844_FragShader;
		case "Yuv_844":			return Params.ShowRawYuv ? Blit_FragShader : Yuv844_FragShader;
		case "RGBA":			return Blit_FragShader;
		case "KinectDepth":		return Depthmm_FragShader;
		case "Depth16mm":		return Depthmm_FragShader;
		case "uyvy":			return Uyvy_FragShader;
	
		default:break;
	}
	
	let Formats = [];
	Textures.forEach(t => Formats.push(t.GetFormat()));
	Pop.Debug("No specific shader for " + Formats.join(','));
	return Blit_FragShader;
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
	let ShaderSource = GetShaderForTextures(Textures);
	

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
	this.CameraName = CameraName;
	this.VideoTextures = [];
	this.EncodedTextures = [];
	this.DecodedTextures = [];
	this.CameraFrameCounter = new Pop.FrameCounter(CameraName);
	this.EncodedH264Counter = new Pop.FrameCounter(CameraName + " h264 packets");
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
			//Pop.Debug("Wait for next decoder packet");

			const Frame = await this.Decoder.WaitForNextFrame();
			this.DecodedTextures = Frame.Planes;
			this.DecodedH264Counter.Add();
			//Pop.Debug("Decoded h264 frame",JSON.stringify(Frame));
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

			//Pop.Debug("Wait for next encoder packet");
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
			//Pop.Debug(`Got packet x${Packet.Data.length}`,Packet.Data.slice(0,10));
			this.EncodedH264KbCounter.Add(Packet.Data.length/1024);
			//this.EncodedH264Counter.Add();	not important

			const Meta = {};
			Meta.Time = Packet.Time;
			const H264Meta = Pop.H264.GetNaluMeta(Packet.Data);
			const IsKeyframe = Pop.H264.IsKeyframe(Packet.Data);
			
			//	send out packet
			//Pop.Debug(`H264 packet IsKeyframe=${IsKeyframe} x${Packet.Data.length}bytes Meta=${JSON.stringify(H264Meta)}`);
			QueueFrame(Packet.Data,Meta,IsKeyframe,this.CameraName);

			//	queue for re-decode for testing
			if (this.Decoder)
			{
				//	always decode a keyframe so SPS&PPS is always setup, and I guess then we see
				let Decode = Params.EnableDecodingOnlyKeyframes ? IsKeyframe : true;
				if (Decode && Params.EnableDecoding)
				{
					//	attempt to emulate udp
					const PacketMaxSize = 991000;
					for ( let i=0;	i<Packet.Data.length;	i+=PacketMaxSize )
					{
						const Start = i;
						const End = Math.min( Start + PacketMaxSize, Packet.Data.length );
						const Chunk = Packet.Data.slice( Start, End );
						this.Decoder.Decode(Chunk);
					}
					//Pop.Debug("Decode h264 packet...");
					//this.Decoder.Decode(Packet.Data);
				}
			}
		}
	}

	this.ListenForFrames = async function ()
	{
		//	initial pause to let window thread start
		await Pop.Yield(2000);
		while (true)
		{
			try
			{
				const NewFrame = await this.Source.WaitForNextFrame();
				
				//	javascript core isn't freeing these
				this.VideoTextures.forEach( t => t.Clear() );
				this.VideoTextures = NewFrame.Planes;
				this.CameraFrameCounter.Add();

				const Time = NewFrame.Time ? NewFrame.Time : Pop.GetTimeNowMs();

				//	remake encoder if compression changes
				if ( JSON.stringify(this.EncoderParams) != JSON.stringify(GetEncoderParams()) )
					this.Encoder = null;

				if (!this.Encoder)
				{
					const EncoderParams = GetEncoderParams();
					Pop.Debug("New encoder",EncoderParams);
					this.Encoder = new Pop.Media.H264Encoder(EncoderParams);
					this.EncoderParams = EncoderParams;
					this.Encoder.FrameCount = 0;
				}

				const EncodedTexture = GetH264Pixels(this.VideoTextures);
				if ( EncodedTexture )
				{
					this.Encoder.FrameCount++;
					const EncodeKeyframe = (this.Encoder.FrameCount % Params.KeyframeEveryNFrames) == 0;
					
					const EncodeOptions = {};
					EncodeOptions.Time = Time;
					EncodeOptions.Keyframe = EncodeKeyframe;
					//EncodedTexture.Clip([0,0,640,480]);
					this.EncodedTextures = [EncodedTexture];
					this.Encoder.Encode(EncodedTexture,EncodeOptions);
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
	this.EncoderParams = null;	//	used to catch changes in params, switch to a callback!
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
			/*
			//	testing
			if ( Device.Serial.includes('Back') )
				return true;
			if ( Device.Serial.includes('FaceTime') )
				return true;
*/
			if ( Device.Serial.includes('KinectAzure') )
				return true;

			if (Device.Serial.startsWith('Freenect'))
				if (Device.Serial.endsWith('_Depth'))
					return true;
			if (Device.Serial.startsWith('Kinect2'))
				if (Device.Serial.endsWith('_Depth'))
					return true;
			
			return false;
		}

		try
		{
			let Devices = await Pop.Media.EnumDevices();
			Pop.Debug("Pop.Media.EnumDevices found(" + JSON.stringify(Devices) + ") result type=" + (typeof Devices));
			Devices = Devices.Devices.filter(IsKinectDevice);

			//	gr: only create one
			CreateCamera(Devices[0]);
			//Devices.forEach(CreateCamera);

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

const WebsocketPorts = [Params.WebsocketPort];
//WebsocketLoop(WebsocketPorts,OnNewPeer,SendNextFrame).then(Pop.Debug).catch(Pop.Debug);

const UdpHosts = [['127.0.0.1',Params.UdpPort],[Params.UdpHost,Params.UdpPort]];
UdpClientSocketLoop(UdpHosts,OnNewPeer,SendNextFrame).then(Pop.Debug).catch(Pop.Debug);

//	gr: wiuthout UDP this doesnt find the kinect!?
//	gr: or if the TCP is running, it does. something blocks in TCP that should be async
const TcpHosts = [[Params.TcpHost,Params.TcpPort]];
//TcpClientSocketLoop(TcpHosts,OnNewPeer,SendNextFrame).then(Pop.Debug).catch(Pop.Debug);
/*


let CurrentNumber = 0;
async function SendNextNumberFrame(SendFunc)
{
	await Pop.Yield(10);
	
	//	make a buffer of shorts
	let NumbersPerFrame = 10000;
	let Shorts = new Uint16Array(NumbersPerFrame);
	for ( let i=0;	i<NumbersPerFrame;	i++ )
	{
		let x = CurrentNumber++;
		Shorts[i] = x;
	}

	SendFunc(new Uint8Array(Shorts.buffer,Shorts.byteOffset,Shorts.byteLength));
}

const UdpHosts = [[Params.UdpHost,Params.UdpPort]];
UdpClientSocketLoop(UdpHosts,OnNewPeer,SendNextNumberFrame).then(Pop.Debug).catch(Pop.Debug);
*/
