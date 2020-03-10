let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let CompareFragShader = Pop.LoadFileAsString('Compare.frag.glsl');

//Pop.Include('../PopEngineCommon/PopH264.js');


Pop.CreateColourTexture = function(Colour4)
{
	let NewTexture = new Pop.Image();
	NewTexture.WritePixels( 1, 1, Colour4 );
	return NewTexture;
}


let InputImage = Pop.CreateColourTexture([255,0,0,255]);
let YuvImage = null;
let OutputImage = null;
const NullImage = Pop.CreateColourTexture([0,255,0,255]);


let BlitShader = null;
let CompareShader = null;

function Render(RenderTarget)
{
	if ( !BlitShader )
		BlitShader = new Pop.Opengl.Shader( RenderTarget, VertShader, BlitFragShader );
	
	if ( !CompareShader )
		CompareShader = new Pop.Opengl.Shader( RenderTarget, VertShader, CompareFragShader );
	
	const DrawInput_SetUniforms = function (Shader)
	{
		Shader.SetUniform("VertexRect",[0,0,0.25,1]);
		Shader.SetUniform("Texture",InputImage);
	}
	RenderTarget.DrawQuad(BlitShader,DrawInput_SetUniforms);

	const DrawYuv_SetUniforms = function (Shader)
	{
		const Img = YuvImage ? YuvImage : NullImage;
		Shader.SetUniform("VertexRect",[0.25,0,0.25,1]);
		Shader.SetUniform("Texture",Img);
	}
	RenderTarget.DrawQuad(BlitShader,DrawYuv_SetUniforms);

	const DrawDecoded_SetUniforms = function(Shader)
	{
		const Img = OutputImage ? OutputImage : NullImage;
		Shader.SetUniform("VertexRect", [0.50,0,0.25,1] );
		Shader.SetUniform("Texture",Img );
	}
	RenderTarget.DrawQuad(BlitShader,DrawDecoded_SetUniforms );

	const DrawCompare_SetUniforms = function(Shader)
	{
		const Img = OutputImage ? OutputImage : NullImage;
		Shader.SetUniform("VertexRect", [0.75,0,0.25,1] );
		Shader.SetUniform("TextureA", YuvImage );
		Shader.SetUniform("TextureB",Img );
	}
	RenderTarget.DrawQuad( CompareShader, DrawCompare_SetUniforms );
}

let RenderWindow = new Pop.Opengl.Window("H264");
RenderWindow.OnRender = Render;
RenderWindow.OnMouseMove = function(){};

function GetNaluSize(Data)
{
	const Data4 = Data.slice(0,4);
	if (Data[0] != 0 && Data[1] != 0 )
		throw `Nalu[${Data4}] != 0001|001`;

	if (Data[2] == 1)
		return 3;
	if (Data[2] == 0 && Data[3] == 1)
		return 4;

	throw `Nalu[${Data4}] != 0001|001`;
}

function IsH264MetaPacket(Data)
{
	const NaluSize = GetNaluSize(Data);
	const TypeAndPriority = Data[NaluSize];
	const Type = TypeAndPriority & 0x1f;
	const Priority = TypeAndPriority >> 5;

	const H264_SPS = 7;
	const H264_PPS = 8;
	const H264_SEI = 6;	//	supplimental enhancement info
	const H264_EOS = 10;	//	endof sequence
	const H264_EOF = 11;	//	end of stream
	Pop.Debug('H264 packet type',Type);
	switch (Type)
	{
		case H264_SPS:
		case H264_PPS:
		case H264_SEI:
		case H264_EOS:
		case H264_EOF:
			return true;

		//	picture
		default:
			return false;
	}
}

async function Run(Filename,EncodePreset)
{
	const Input = new Pop.Image(Filename);
	InputImage = Input;

	const Yuv = new Pop.Image();
	Yuv.Copy(Input);
	Yuv.SetFormat('Yuv_8_8_8_Ntsc');
	YuvImage = Yuv;

	//OutputImage = null;	//	clear for clarity, keep to help comparison
	const Encoder = new Pop.Media.H264Encoder(EncodePreset);
	Encoder.Encode(Yuv,0);
	Encoder.EncodeFinished();

	const Decoder = new Pop.Media.AvcDecoder(false);
	
	//	encode, decode, encode, decode etc
	while (true)
	{
		//	pop packets until we get a picture packet
		Pop.Debug("Wait for packet");
		const Packet = await Encoder.WaitForNextPacket();
		//Pop.Debug("Packet",Array.from(Packet.Data));
		Decoder.Decode(Packet.Data,0);
		if (IsH264MetaPacket(Packet.Data))
			continue;

		const Frame = await Decoder.WaitForNextFrame();
		Pop.Debug("Frame",JSON.stringify(Frame));
		
		const FramePlane = Frame.Planes[0];
		//Pop.Debug("FramePlane",JSON.stringify(FramePlane));
		
		Pop.Debug("Output frame",FramePlane.GetFormat());
		OutputImage = FramePlane;
		//OutputImage.SetFormat('Greyscale');
		return;
	}
}

let EncodePreset = false;

let ParamsWindow = new Pop.Gui.Window("Preset Quality", [0,0,200,100], false );
//ParamsWindow.EnableScrollbars(true,true);
let Label = new Pop.Gui.Label( ParamsWindow, [0,0,200,20] );
let Slider = new Pop.Gui.Slider( ParamsWindow, [0,20,200,80] );

Slider.SetMinMax( 0, 9 );
Slider.OnChanged = function(Value)
{
	Label.SetValue("Encoder Preset: " + Value);
	Value = Math.floor(Value);
	if ( Value != EncodePreset || EncodePreset === false )
	{
		EncodePreset = Value;
		function OnError(e)
		{
			Pop.Debug(`error ${e}`);
		}
		Run('cat.jpeg',EncodePreset).then().catch(OnError);
	}
}
//	init
Slider.SetValue( 5 );
Slider.OnChanged( 5 );



