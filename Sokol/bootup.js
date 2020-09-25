Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('../PopEngineCommon/PopFrameCounter.js');


const Window = new Pop.Gui.Window("Sokol Test");

const Sokol = new Pop.Sokol.Context(Window, "GLView");

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
precision highp float;
uniform sampler2D ImageA;
uniform vec4 ColourB;
uniform vec4 ColourA;
varying vec2 uv;
void main()
{
	if ( uv.x < 0.5 )
		gl_FragColor = ColourA;
	else
		gl_FragColor = ColourB;
	
	gl_FragColor = texture2D( ImageA, uv );
	//gl_FragColor.xy = uv;
	//gl_FragColor = vec4(0,0,0,1);
}
`;
//	todo: get rid of this requirement from sokol
const TestShaderUniforms = [];
TestShaderUniforms.push( {Name:'ColourA',Type:'vec4'} );
TestShaderUniforms.push( {Name:'ColourB',Type:'vec4'} );
TestShaderUniforms.push( {Name:'ImageA',Type:'sampler2D'} );

let ScreenQuad = null;
let TestShader = null;
let ScreenQuad_Attribs = null;


function GetRenderCommands()
{
	const Commands = [];
	const Blue = (FrameCounter % 60)/60;
	
	Commands.push(['Clear',1,0,Blue]);
	
	{
		const Uniforms = {};
		Uniforms.ColourA = [Blue,1,0,1];
		Uniforms.ColourB = [0,1,1,1];
		Uniforms.ImageA = CatImage;
		Commands.push(['Draw',ScreenQuad,TestShader,Uniforms]);
	}
	
	return Commands;
}


async function RenderLoop()
{
	/*
	await Pop.Yield(100);
	//	submit frame for next paint
	const Commands = GetRenderCommands();
	//Pop.Debug(`Render ${FrameCounter}`);
	await Sokol.Render(Commands);
	*/
	while (Sokol)
	{
		if ( !TestShader && ScreenQuad_Attribs )
		{
			const FragSource = TestShader_FragSource;
			const VertSource = TestShader_VertSource;
			try
			{
				const TestShaderAttribs = ScreenQuad_Attribs;
				TestShader = await Sokol.CreateShader(VertSource,FragSource,TestShaderUniforms,TestShaderAttribs);
				Pop.Debug(`TestShader=${TestShader}`);
			}
			catch(e)
			{
				Pop.Warning(e);
			}
		}
		
		
		if ( !ScreenQuad )
		{
			try
			{
				Pop.Debug(`Creating geometry...`);
				ScreenQuad = await GetScreenQuad_TriangleBuffer(Sokol);
				Pop.Debug(`ScreenQuad=${ScreenQuad}`);
			}
			catch(e)
			{
				Pop.Warning(e);
			}
		}
		
		
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
	}
}
RenderLoop().catch(Pop.Warning);


