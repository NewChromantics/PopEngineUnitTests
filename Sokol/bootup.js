Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('../PopEngineCommon/PopFrameCounter.js');

const Window = new Pop.Gui.Window("TestAppWindow");
const RenderView = new Pop.Gui.RenderView(Window,"TestRenderView");
Window.OnMouseMove = function(x,y,Button)
{
	Pop.Debug(`OnMouseMove ${Array.from(arguments)}`);
	MouseUv = [x,y];
};
const Sokol = new Pop.Sokol.Context(RenderView);

let FrameCounter = 0;
const FrameRateCounter = new Pop.FrameCounter('Render');

const CatImage = Pop.LoadFileAsImage('Cat.jpg');

async function CreateTriangleBuffer(RenderContext,Geometry)
{
	//	auto-calc triangle counts or vertex sizes etc
	if ( !Geometry.TriangleCount )
	{
		if ( Geometry.PositionSize && Geometry.Positions )
		{
			Geometry.TriangleCount = Geometry.Positions.length / Geometry.PositionSize;
		}
		else
		{
			throw `Cannot determine trianglecount/vertex attribute size for geometry`;
		}
	}
	
	const VertexAttribs = [];
	const LocalPosition = {};
	//	gr: should engine always just figure this out?
	LocalPosition.Size = Geometry.Positions.length / Geometry.TriangleCount;
	LocalPosition.Data = new Float32Array( Geometry.Positions );
	VertexAttribs['LocalPosition'] = LocalPosition;
	
	if ( Geometry.TexCoords )
	{
		const Uv0 = {};
		Uv0.Size = Geometry.TexCoords.length / Geometry.TriangleCount;
		Uv0.Data = new Float32Array( Geometry.TexCoords );
		VertexAttribs['LocalUv'] = Uv0;
	}
	
	//const TriangleIndexes = new Int32Array( Geometry.TriangleIndexes );
	const TriangleIndexes = undefined;
	const TriangleBuffer = await RenderContext.CreateGeometry( VertexAttribs, TriangleIndexes );
	
	//	these need to be in the right order...
	//	that depends what order thejs lib reads VertexAttribs in CreateGeometry...
	//	TriangleBuffer isn't an object either...
	ScreenQuad_Attribs = Object.keys(VertexAttribs);
	
	return TriangleBuffer;
}

function GetScreenQuad(MinX,MinY,MaxX,MaxY,TheZ=0)
{
	let Positions = [];
	let TexCoords = [];
	
	function AddTriangle(a,b,c)
	{
		Positions.push( ...a.slice(0,3) );
		Positions.push( ...b.slice(0,3) );
		Positions.push( ...c.slice(0,3) );
		
		const TriangleIndex = Positions.length / 3;
		function PosToTexCoord(xyzuv)
		{
			const u = xyzuv[3];
			const v = xyzuv[4];
			const w = TriangleIndex;
			return [u,v,w];
		}
		
		TexCoords.push( ...PosToTexCoord(a) );
		TexCoords.push( ...PosToTexCoord(b) );
		TexCoords.push( ...PosToTexCoord(c) );
	}
	
	let tr = [MaxX,MinY,TheZ,	1,0];
	let tl = [MinX,MinY,TheZ,	0,0];
	let br = [MaxX,MaxY,TheZ,	1,1];
	let bl = [MinX,MaxY,TheZ,	0,1];
	
	AddTriangle( tl, tr, br );
	AddTriangle( br, bl, tl );
	
	const Geometry = {};
	Geometry.Positions = Positions;
	Geometry.PositionSize = 3;
	Geometry.TexCoords = TexCoords;
	return Geometry;
}

async function GetScreenQuad_TriangleBuffer(RenderContext)
{
	const Geometry = GetScreenQuad(-0.5,-0.5,0.5,0.5,0.5);
	const Buffer = CreateTriangleBuffer(RenderContext,Geometry);
	return Buffer;
}



const TestShader_VertSource =`
#version 100
precision highp float;
attribute vec3 LocalUv;
attribute vec3 LocalPosition;
varying vec2 uv;
void main()
{
	gl_Position = vec4(LocalPosition,1);
	gl_Position.z = 0.5;
	uv = LocalUv.xy;
}
`;
const TestShader_FragSource =`
#version 100
precision highp float;
uniform sampler2D ImageA;
uniform sampler2D ImageB;
uniform sampler2D ImageC;
uniform sampler2D ImageD;
uniform vec4 ColourB;
uniform vec4 ColourA;
varying vec2 uv;
uniform vec2 MouseUv;
const float MouseRadius = 0.01;

float Range(float Min,float Max,float Value)
{
	return (Value-Min) / (Max-Min);
}

void GetCornerUv(out int CornerIndex,inout vec2 uv)
{
	if ( uv.x < 0.5 && uv.y < 0.5 )
	{
		CornerIndex = 0;
		uv.x = Range( 0.0, 0.5, uv.x );
		uv.y = Range( 0.0, 0.5, uv.y );
	}
	else if ( uv.x >= 0.5 && uv.y < 0.5 )
	{
		CornerIndex = 1;
		uv.x = Range( 0.5, 1.0, uv.x );
		uv.y = Range( 0.0, 0.5, uv.y );
	}
	else if ( uv.x >= 0.5 && uv.y >= 0.5 )
	{
		CornerIndex = 2;
		uv.x = Range( 0.5, 1.0, uv.x );
		uv.y = Range( 0.5, 1.0, uv.y );
	}
	else //if ( uv.x < 0.5 && uv.y >= 0.5 )
	{
		CornerIndex = 3;
		uv.x = Range( 0.0, 0.5, uv.x );
		uv.y = Range( 0.5, 1.0, uv.y );
	}
} 

void main()
{
	int CornerIndex;
	vec2 Sampleuv = uv;
	GetCornerUv(CornerIndex,Sampleuv);
	if ( CornerIndex == 0 )
		gl_FragColor = texture2D( ImageA, Sampleuv );
	if ( CornerIndex == 1 )
		gl_FragColor = texture2D( ImageB, Sampleuv );
	if ( CornerIndex == 2 )
		gl_FragColor = texture2D( ImageC, Sampleuv );
	if ( CornerIndex == 3 )
		gl_FragColor = texture2D( ImageD, Sampleuv );
		
	//	show mouse pos
	if ( length( uv - MouseUv ) < MouseRadius )
		gl_FragColor = vec4(1,1,1,1);
}
`;

const TargetTestShader_FragSource = `
precision highp float;
varying vec2 uv;
void main()
{
	gl_FragColor = vec4(uv,0,1);
}
`;
//	todo: get rid of this requirement from sokol
const TestShaderUniforms = 
[
	{Name:'ColourA',Type:'vec4'},
	{Name:'ColourB',Type:'vec4'},
	{Name:'ImageA',Type:'sampler2D'},
	{Name:'ImageB',Type:'sampler2D'},
	{Name:'ImageC',Type:'sampler2D'},
	{Name:'ImageD',Type:'sampler2D'},
	{Name:'MouseUv',Type:'vec2'},
];
	
const TargetTestShaderUniforms = TestShaderUniforms;

let ScreenQuad = null;
let TestShader = null;
let ScreenQuad_Attribs = null;
let TargetImage;
let RenderImage;
let MouseUv = [0.5,0.5];


function GetRenderCommands()
{
	const Commands = [];
	const Blue = (FrameCounter % 60)/60;

	if ( !TargetImage )
	{
		TargetImage = new Pop.Image('Target Image');
		TargetImage.WritePixels(100,100,new Uint8Array(100 * 100 * 4),'RGBA');
	}
	
	//	test freeing resources by creating a new image every time
	if ( !RenderImage )
		RenderImage = new Pop.Image(`Image #${FrameCounter}`);
	RenderImage.Copy(CatImage);
	//	flip every frame
	CatImage.Flip();

	//	render cleared colour to the target image
	Commands.push(['SetRenderTarget', TargetImage, [0,1,0] ]);

	//	render quad with shader to screen
	Commands.push(['SetRenderTarget', null, [1,0,Blue] ]);
	{
		const Uniforms = {};
		Uniforms.ColourA = [Blue,1,0,1];
		Uniforms.ColourB = [0,1,1,1];
		Uniforms.ImageA = CatImage;
		Uniforms.ImageB = RenderImage;
		Uniforms.ImageC = TargetImage;
		Uniforms.ImageD = null;			//	we want our renderer to cope with null as texture input
		
		Uniforms.MouseUv = MouseUv;
		 
		//Uniforms.ZZZFillerForChakraCore = false;
		Commands.push(['Draw',ScreenQuad,TestShader,Uniforms]);
	}
	
	return Commands;
}


async function RenderLoop()
{
	ScreenQuad = await GetScreenQuad_TriangleBuffer(Sokol);

	const FragSource = TestShader_FragSource;
	const VertSource = TestShader_VertSource;
	const TestShaderAttribs = ScreenQuad_Attribs;
	TestShader = await Sokol.CreateShader(VertSource,FragSource,TestShaderUniforms,TestShaderAttribs);
	Pop.Debug(`TestShader=${TestShader}`);

	while (Sokol)
	{
		try
		{
			//await Pop.Yield(100);
			//	submit frame for next paint
			const Commands = GetRenderCommands();
			//Pop.Debug(`Render ${FrameCounter}`);
			await Sokol.Render(Commands);
		}
		catch(e)
		{
			Pop.Warning(e);
			await Pop.Yield(1000);
		}

		FrameCounter++;
		FrameRateCounter.Add();
		Pop.GarbageCollect();
		
		//	if garbage collector isn't working, we need to manually clear :/
		RenderImage.Clear();
		RenderImage = null;
	}
}
RenderLoop().catch(Pop.Warning);

