#version 410
in float3 LocalPosition;
out float3 Colour;

uniform float3 CameraWorldPos;
uniform mat4 CameraProjectionMatrix;
uniform float3 Transform_WorldPosition;


void main()
{
	float3 WorldPos = LocalPosition + Transform_WorldPosition;
	float3 CameraPos = WorldPos - CameraWorldPos;	//	world to camera space
	float4 ProjectionPos = CameraProjectionMatrix * float4( CameraPos, 1 );
	gl_Position = ProjectionPos;
	
	Colour = LocalPosition;
}

