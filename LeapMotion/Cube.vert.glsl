#version 410
in float3 LocalPosition;
out float3 Colour;

uniform float3 CameraWorldPos;
uniform mat4 CameraProjectionMatrix;
uniform float3 Transform_WorldPosition;

uniform float LocalScale = 0.01;
uniform float WorldScale = 0.80;

void main()
{

	float3 LocalPos = LocalPosition*LocalScale;
	float3 WorldPos = LocalPos + Transform_WorldPosition;
	WorldPos *= WorldScale;
	float3 CameraPos = WorldPos - CameraWorldPos;	//	world to camera space
	//float4 ProjectionPos = CameraProjectionMatrix * float4( CameraPos, 1 );

	float4 ProjectionPos = float4( CameraPos.xy, 0, 1 );
	gl_Position = ProjectionPos;
	
	Colour = LocalPosition;
}

