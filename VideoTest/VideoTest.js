let VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
let Uvy844FragShader = Pop.LoadFileAsString('Uvy844.frag.glsl');
let Yuv888FragShader = Pop.LoadFileAsString('Yuv8_88.frag.glsl');
let Yuv8888FragShader = Pop.LoadFileAsString('Yuv8888.frag.glsl');
let Yuv8_8_8FragShader = Pop.LoadFileAsString('Yuv8_8_8.frag.glsl');
let BlitFragShader = Pop.LoadFileAsString('Blit.frag.glsl');


function TVideoWindow(Filename)
{
	this.Textures = [ Pop.CreateColourTexture([0,0,0,1]) ];
	
	
	this.OnNewFrame = function(Planes)
	{
		if ( this.Textures )
		{
			//	gr: don't need to clear manually any more?
			this.Textures.forEach( t => t.Clear() );
			this.Textures = null;
		}
		this.Textures = Planes;
	}
	
	this.Video = new TVideoLoop( Filename, this.OnNewFrame.bind(this) );
	
	this.OnRender = function(RenderTarget)
	{
		let Texture0 = this.Textures[0];
		let Texture1 = this.Textures[1];
		let Texture2 = this.Textures[2];
		
		let ShaderSource = BlitFragShader;
		if ( Texture0.GetFormat() == "YYuv_8888_Full" )
			ShaderSource = Yuv8888FragShader;
		else if ( Texture0.GetFormat() == "Uvy_844_Full" )
			ShaderSource = Uvy844FragShader;
		else if ( Texture0.GetFormat() == "Greyscale" && this.Textures.length == 3 )
			ShaderSource = Yuv8_8_8FragShader;
		else
			Pop.Debug("No specific shader for "+Texture0.GetFormat());
		
		//let FragShader = Pop.GetShader( RenderTarget, Uvy844FragShader );
		//let FragShader = Pop.GetShader( RenderTarget, Yuv8888FragShader );
		//let FragShader = Pop.GetShader( RenderTarget, BlitFragShader );
		let FragShader = Pop.GetShader( RenderTarget, ShaderSource );

		let SetUniforms = function(Shader)
		{
			Shader.SetUniform("Texture", Texture0 );
			Shader.SetUniform("LumaTexture", Texture0 );
			Shader.SetUniform("ChromaTexture", Texture1 );
			Shader.SetUniform("ChromaUTexture", Texture1 );
			Shader.SetUniform("ChromaVTexture", Texture2 );
		}
		RenderTarget.DrawQuad( FragShader, SetUniforms.bind(this) );
	}
	
	this.Window = new Pop.Opengl.Window(Filename);
	this.Window.OnRender = this.OnRender.bind(this);
	this.Window.OnMouseMove = function(){};
	this.Window.OnMouseDown = function(){};
	this.Window.OnMouseUp = function(){};
	
}


let Filename = "ToyStory4_Baseline3.mp4";
let VideoWindow = new TVideoWindow(Filename);


