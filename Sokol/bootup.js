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
	return TriangleBuffer;
}

function GetScreenQuad(MinX,MinY,MaxX,MaxY,TheZ=0)
{
	let Positions = [];
	let TexCoords = [];
	
	function AddTriangle(a,b,c)
	{
		Positions.push( ...a );
		Positions.push( ...b );
		Positions.push( ...c );
		
		const TriangleIndex = Positions.length / 3;
		function PosToTexCoord(xyz)
		{
			const u = xyz[0];
			const v = xyz[2];
			const w = TriangleIndex;
			return [u,v,w];
		}
		
		TexCoords.push( ...PosToTexCoord(a) );
		TexCoords.push( ...PosToTexCoord(b) );
		TexCoords.push( ...PosToTexCoord(c) );
	}
	
	let tr = [MaxX,MinY,TheZ];
	let tl = [MinX,MinY,TheZ];
	let br = [MaxX,MaxY,TheZ];
	let bl = [MinX,MaxY,TheZ];
	
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
	const Geometry = GetScreenQuad(0,0,1,1,0);
	const Buffer = CreateTriangleBuffer(RenderContext,Geometry);
	return Buffer;
}



const TestShader_VertSource =`
precision highp float;
attribute vec3 LocalPosition;
attribute vec3 LocalUv;
varying vec2 uv;
void main()
{
	gl_Position = vec4(LocalPosition,1);
	uv = LocalUv.xy;
}
`;

const TestShader_FragSource =`
precision highp float;
uniform vec4 Colour;
varying vec2 uv;
void main()
{
	gl_FragColor = Colour;
	gl_FragColor.xy = uv;
}
`;

let ScreenQuad = null;
let TestShader = null;



function GetRenderCommands()
{
	const Commands = [];
	const Blue = (FrameCounter % 60)/60;
	
	Commands.push(['Clear',1,0,Blue]);
	
	/*
	const Uniforms = {};
	Uniforms.Colour = [0,1,0,1];
	Commands.push(['Draw',ScreenQuad,TestShader,Uniforms]);
	*/
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
		if ( !TestShader )
		{
			const FragSource = TestShader_FragSource;
			const VertSource = TestShader_VertSource;
			try
			{
				TestShader = await Sokol.CreateShader(VertSource,FragSource);
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
		
		
		//await Pop.Yield(100);
		//	submit frame for next paint
		const Commands = GetRenderCommands();
		//Pop.Debug(`Render ${FrameCounter}`);
		await Sokol.Render(Commands);
		FrameCounter++;
		FrameRateCounter.Add();
		
		
	}
}
RenderLoop().catch(Pop.Warning);


