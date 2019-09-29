#version 410
in float3 LocalPosition;
out float3 Colour;

uniform mat4 LocalToWorldTransform;
uniform mat4 WorldToCameraTransform;
uniform mat4 CameraToProjectionTransform;

void main()
{
	float4 WorldPos = LocalToWorldTransform * float4(LocalPosition,1);
	float4 CameraPos = WorldToCameraTransform * WorldPos;
	float4 ProjectionPos = CameraToProjectionTransform * CameraPos;

	gl_Position = ProjectionPos;
	
	Colour = LocalPosition;
}

