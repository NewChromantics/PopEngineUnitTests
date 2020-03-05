precision highp float;
varying vec2 uv;

uniform sampler2D Texture;

uniform float DepthMin = 0.0;
uniform float DepthMax = 4000.0;

float Range(float Min,float Max,float Value)
{
	return (Value-Min) / (Max-Min);
}

float3 NormalToRedGreenBlue(float Normal)
{
	if ( Normal < 0 )
	{
		return float3(0,0,0);
	}
	else if ( Normal < 0.25 )
	{
		Normal = Range( 0.0, 0.25, Normal );
		return float3( 1, Normal, 0 );
	}
	else if ( Normal <= 0.5 )
	{
		Normal = Range( 0.25, 0.50, Normal );
		return float3( 1.0-Normal, 1, 0 );
	}
	else if ( Normal <= 0.75 )
	{
		Normal = Range( 0.50, 0.75, Normal );
		return float3( 0, 1, Normal );
	}
	else if ( Normal <= 1 )
	{
		Normal = Range( 0.75, 1.00, Normal );
		return float3( 0, 1.0-Normal, 1 );
	}

	//	>1
	return float3( 1,1,1 );
}

void main()
{
	gl_FragColor = float4(0,0,0,1);

	//	single 16bit format
	float Depth = texture(Texture, uv).x;
	/*
	float2 ab = texture(Texture, uv).yx;
	float Depth = ab.x * 65280.0;
	Depth += ab.y * 256.0;	
	Depth /= 65535.0;
	*/
	const float SixteenBit = 65535.0;
	Depth *= 65535.0;
	float Depthf = Range( DepthMin, DepthMax, Depth );
	gl_FragColor.xyz = NormalToRedGreenBlue(Depthf);

	if ( Depth == 0 )
		gl_FragColor.xyz = float3(0,0,0);
}


