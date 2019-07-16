Pop.Include = function(Filename)
{
	let Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('../PopEngineCommon/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopMath.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');
Pop.Include('../PopEngineCommon/PopCamera.js');
const CubeFragShader = Pop.LoadFileAsString('Cube.frag.glsl');
const CubeVertShader = Pop.LoadFileAsString('Cube.vert.glsl');


function CreateCubeGeometry(RenderTarget)
{
	let VertexSize = 3;
	let VertexData = [];
	let TriangleIndexes = [];
	
	let AddTriangle = function(a,b,c)
	{
		let FirstTriangleIndex = VertexData.length / VertexSize;
		
		a.forEach( v => VertexData.push(v) );
		b.forEach( v => VertexData.push(v) );
		c.forEach( v => VertexData.push(v) );

		TriangleIndexes.push( FirstTriangleIndex+0 );
		TriangleIndexes.push( FirstTriangleIndex+1 );
		TriangleIndexes.push( FirstTriangleIndex+2 );
	}
	
	let tln = [-1,-1,-1];
	let trn = [ 1,-1,-1];
	let brn = [ 1, 1,-1];
	let bln = [-1, 1,-1];
	let tlf = [-1,-1, 1];
	let trf = [ 1,-1, 1];
	let brf = [ 1, 1, 1];
	let blf = [-1, 1, 1];

	
	//	near
	AddTriangle( tln, trn, brn );
	AddTriangle( brn, bln, tln );
	//	far
	AddTriangle( trf, tlf, blf );
	AddTriangle( blf, brf, trf );
	 
	//	top
	AddTriangle( tln, tlf, trf );
	AddTriangle( trf, trn, tln );
	//	bottom
	AddTriangle( bln, blf, brf );
	AddTriangle( brf, brn, bln );
	
	//	left
	AddTriangle( tlf, tln, bln );
	AddTriangle( bln, blf, tlf );
	//	right
	AddTriangle( trn, trf, brf );
	AddTriangle( brf, brn, trn );
	
	const VertexAttributeName = "LocalPosition";
	
	//	loads much faster as a typed array
	VertexData = new Float32Array( VertexData );
	TriangleIndexes = new Int32Array(TriangleIndexes);
	
	let TriangleBuffer = new Pop.Opengl.TriangleBuffer( RenderTarget, VertexAttributeName, VertexData, VertexSize, TriangleIndexes );
	return TriangleBuffer;
}


let Camera = new Pop.Camera();
let Cube = null;
let LastHandFrame = null;

function GetCube(RenderTarget)
{
	if ( !Cube )
		Cube = CreateCubeGeometry( RenderTarget );

	return Cube;
}

function GetCubePositions()
{
	if ( !LastHandFrame )
		return [ [0,0,0] ];
	
	let Positions = [];
	
	let EnumHand = function(Hand)
	{
		if ( !Hand )
			return;

		let EnumJoint = function(JointName)
		{
			//	skip over non-positions
			const xyz = Hand[JointName];
			if ( !Array.isArray(xyz) && xyz.constructor != Float32Array )
				return;
			
			let JointFilter =
			[
				'Thumb3','Middle3','Ring3','Pinky3','Index3'
			];
			if ( !JointFilter.includes(JointName) )
				return;
			
			Pop.Debug(JointName);
			//	gr: engine doesnt take Float32Array??
			Positions.push( Array.from(xyz) );
		}
		let Joints = Object.keys(Hand);
		Joints.forEach( EnumJoint );
	}
	EnumHand( LastHandFrame.Left );
	EnumHand( LastHandFrame.Right );
	//Pop.Debug("Got positions x",Positions.length,Positions[0]);
	return Positions;
}

function Render(RenderTarget)
{
	RenderTarget.ClearColour( 0,0,0 );
	const Shader = Pop.GetShader( RenderTarget, CubeFragShader, CubeVertShader );
	const CubeGeo = GetCube(RenderTarget);
	const Viewport = RenderTarget.GetScreenRect();
	const CameraProjectionMatrix = Camera.GetProjectionMatrix(Viewport);
	let Cubes = GetCubePositions();
	
	let RenderCube = function(Cube,CubeIndex)
	{
		let SetUniforms = function(Shader)
		{
			Shader.SetUniform('ColourIndex', CubeIndex );
			Shader.SetUniform('Transform_WorldPosition', Cube );
			Shader.SetUniform('CameraProjectionMatrix',CameraProjectionMatrix);
			Shader.SetUniform('CameraWorldPos',Camera.Position);
		}
		RenderTarget.DrawGeometry( CubeGeo, Shader, SetUniforms );
	}
	Cubes.forEach( RenderCube );
}

let Window = new Pop.Opengl.Window("Leap motion demo");
Window.OnRender = Render;

Window.OnMouseDown = function(x,y,Button)
{
	if ( Button == 0 )
		Camera.OnCameraPan( x, y, true );
	if ( Button == 1 )
		Camera.OnCameraZoom( x, y, true );
}

Window.OnMouseMove = function(x,y,Button)
{
	if ( Button == 0 )
		Camera.OnCameraPan( x, y, false );
	if ( Button == 1 )
		Camera.OnCameraZoom( x, y, false );
};



async function LeapMotionLoop()
{
	let Leap = null;
	let FrameCounter = new Pop.FrameCounter("Leap Motion");
	while ( true )
	{
		try
		{
			if ( !Leap )
			{
				//	gr: todo: turn this into an "xr" device
				//			new Pop.Xr.Input("LeapMotion")
				Leap = new Pop.LeapMotion.Input();
			}
			
			const NextFrame = await Leap.GetNextFrame();
			LastHandFrame = NextFrame;
			FrameCounter.Add();
			//Pop.Debug("New leap motion frame",JSON.stringify(NextFrame) );
		}
		catch(e)
		{
			Pop.Debug("Leap error",e);
			Leap = null;
			await Pop.Yield(100);
		}
	}
}
LeapMotionLoop().then(Pop.Debug).catch(Pop.Debug);

