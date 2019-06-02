let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');


Pop.CreateColourTexture = function(Colour4)
{
	let NewTexture = new Pop.Image();
	NewTexture.WritePixels( 1, 1, Colour4 );
	return NewTexture;
}


let InputImage = Pop.CreateColourTexture([255,0,0,255]);
let OutputImage = Pop.CreateColourTexture([0,255,0,255]);



function Render(RenderTarget)
{
	const ShaderSource = BlitFragShader;
	const FragShader = new Pop.Opengl.Shader( RenderTarget, VertShader, BlitFragShader );
		
	const DrawLeft_SetUniforms = function(Shader)
	{
		Shader.SetUniform("VertexRect", [0,0,0.5,1] );
		Shader.SetUniform("Texture", InputImage );
	}
	RenderTarget.DrawQuad( FragShader, DrawLeft_SetUniforms );

	const DrawRight_SetUniforms = function(Shader)
	{
		Shader.SetUniform("VertexRect", [0.5,0,0.5,1] );
		Shader.SetUniform("Texture", OutputImage );
	}
	RenderTarget.DrawQuad( FragShader, DrawRight_SetUniforms );
}

let Window = new Pop.Opengl.Window("H264");
Window.OnRender = Render;
Window.OnMouseMove = function(){};


async function Run(Filename)
{
	const Input = new Pop.Image(Filename);
	InputImage = Input;
	const Encoder = new Pop.Media.H264Encoder();
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
Run('cat.jpeg').then(Pop.Debug).catch(Pop.Debug);

