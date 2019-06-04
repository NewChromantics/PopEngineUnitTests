let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');
let CompareFragShader = Pop.LoadFileAsString('Compare.frag.glsl');


Pop.CreateColourTexture = function(Colour4)
{
	let NewTexture = new Pop.Image();
	NewTexture.WritePixels( 1, 1, Colour4 );
	return NewTexture;
}


let InputImage = Pop.CreateColourTexture([255,0,0,255]);
let OutputImage = Pop.CreateColourTexture([0,255,0,255]);

let BlitShader = null;
let CompareShader = null;

function Render(RenderTarget)
{
	if ( !BlitShader )
		BlitShader = new Pop.Opengl.Shader( RenderTarget, VertShader, BlitFragShader );
	
	if ( !CompareShader )
		CompareShader = new Pop.Opengl.Shader( RenderTarget, VertShader, CompareFragShader );
	
	const DrawLeft_SetUniforms = function(Shader)
	{
		Shader.SetUniform("VertexRect", [0,0,0.33,1] );
		Shader.SetUniform("Texture", InputImage );
	}
	RenderTarget.DrawQuad( BlitShader, DrawLeft_SetUniforms );

	const DrawRight_SetUniforms = function(Shader)
	{
		Shader.SetUniform("VertexRect", [0.33,0,0.33,1] );
		Shader.SetUniform("Texture", OutputImage );
	}
	RenderTarget.DrawQuad( BlitShader, DrawRight_SetUniforms );

	const DrawCompare_SetUniforms = function(Shader)
	{
		Shader.SetUniform("VertexRect", [0.66,0,0.33,1] );
		Shader.SetUniform("TextureA", InputImage );
		Shader.SetUniform("TextureB", OutputImage );
	}
	RenderTarget.DrawQuad( CompareShader, DrawCompare_SetUniforms );
}

let RenderWindow = new Pop.Opengl.Window("H264");
RenderWindow.OnRender = Render;
RenderWindow.OnMouseMove = function(){};


async function Run(Filename,EncodePreset)
{
	const Input = new Pop.Image(Filename);
	Input.SetFormat('Greyscale');
	InputImage = Input;
	const Encoder = new Pop.Media.H264Encoder(EncodePreset);
	await Encoder.Encode(Input,0);

	const Decoder = new Pop.Media.AvcDecoder();

	//	encode, decode, encode, decode etc
	while ( true )
	{
		const Packet = await Encoder.GetNextPacket();
		//Pop.Debug("Packet",typeof Packet);
		if ( !Packet )
			continue;
		const ExtractPlanes = false;
		const Frames = await Decoder.Decode(Packet,ExtractPlanes);
		Pop.Debug(JSON.stringify(Frames));
		if ( Frames.length == 0 )
			continue;

		Pop.Debug("Frames",Frames);
		Pop.Debug(Frames.length);
		const Frame = Frames[0].Planes[0];
		if ( Frame )
		{
			Pop.Debug("Output frame",Frame.GetFormat());
			OutputImage = Frame;
			OutputImage.SetFormat('Greyscale');
		}
		
	}
}

let EncodePreset = false;

let ParamsWindow = new Pop.Gui.Window("Preset Quality");
let Slider = new Pop.Gui.Slider( ParamsWindow, [0,0,600,80] );
let Label = new Pop.Gui.Label( ParamsWindow, [0,80,600,30] );

Slider.SetMinMax( 0, 9 );
Slider.OnChanged = function(Value)
{
	Label.SetValue("Encoder Preset: " + Value);
	Value = Math.floor(Value);
	if ( Value != EncodePreset || EncodePreset === false )
	{
		EncodePreset = Value;
		Run('cat.jpeg',EncodePreset).then(Pop.Debug).catch(Pop.Debug);
	}
}
//	init
Slider.SetValue( 5 );
Slider.OnChanged( 5 );



