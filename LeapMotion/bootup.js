Pop.Include = function(Filename)
{
	let Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('../PopEngineCommon/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopMath.js');
const CubeFragShader = Pop.LoadFileAsString('Cube.frag.glsl');
const CubeVertShader = Pop.LoadFileAsString('Cube.vert.glsl');

function TCamera()
{
	this.FovVertical = 45;
	this.Position = [ -4,4,20 ];
	this.LookAt = [ 0,0,0 ];
	this.NearDistance = 0.01;
	this.FarDistance = 100;
	
	this.GetProjectionMatrix = function(ViewRect)
	{
		let Aspect = ViewRect[2] / ViewRect[3];
		
		let f = 1.0 / Math.tan( Math.radians(this.FovVertical) / 2);
		let nf = 1 / (this.NearDistance - this.FarDistance);
		
		let Matrix = [];
		Matrix[0] = f / Aspect;
		Matrix[1] = 0;
		Matrix[2] = 0;
		Matrix[3] = 0;
		Matrix[4] = 0;
		Matrix[5] = f;
		Matrix[6] = 0;
		Matrix[7] = 0;
		Matrix[8] = 0;
		Matrix[9] = 0;
		Matrix[10] = (this.FarDistance + this.NearDistance) * nf;
		Matrix[11] = -1;
		Matrix[12] = 0;
		Matrix[13] = 0;
		Matrix[14] = 2 * this.FarDistance * this.NearDistance * nf;
		Matrix[15] = 0;
		
		return Matrix;
	}
}


function OnCameraPan(x,y,FirstClick)
{
	if ( FirstClick )
		Camera.LastPanPos = [x,y];
	
	let Deltax = Camera.LastPanPos[0] - x;
	let Deltay = Camera.LastPanPos[1] - y;
	Camera.Position[0] += Deltax * 0.01
	Camera.Position[1] -= Deltay * 0.01
	
	Camera.LastPanPos = [x,y];
}

function OnCameraZoom(x,y,FirstClick)
{
	if ( FirstClick )
		Camera.LastZoomPos = [x,y];
	
	let Deltax = Camera.LastZoomPos[0] - x;
	let Deltay = Camera.LastZoomPos[1] - y;
	//Camera.Position[0] -= Deltax * 0.01
	Camera.Position[2] -= Deltay * 0.01
	
	Camera.LastZoomPos = [x,y];
}


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


let Camera = new TCamera();
let Cube = null;

function GetCube(RenderTarget)
{
	if ( !Cube )
		Cube = CreateCubeGeometry( RenderTarget );

	return Cube;
}

function GetCubePositions()
{
	return [ [0,0,0] ];
}

function Render(RenderTarget)
{
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
		OnCameraPan( x, y, true );
	if ( Button == 1 )
		OnCameraZoom( x, y, true );
}

Window.OnMouseMove = function(x,y,Button)
{
	if ( Button == 0 )
		OnCameraPan( x, y, false );
	if ( Button == 1 )
		OnCameraZoom( x, y, false );
};

