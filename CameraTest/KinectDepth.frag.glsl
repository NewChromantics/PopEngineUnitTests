precision highp float;
varying vec2 uv;

uniform sampler2D Texture;

const float DepthMax = 4000.0;

float Range(float Min,float Max,float Value)
{
	return (Value-Min) / (Max-Min);
}

float3 NormalToRedGreen(float Normal)
{
	if ( Normal < 0.5 )
	{
		Normal = Range( 0.0, 0.5, Normal );
		return float3( 1, Normal, 0 );
	}
	else if ( Normal <= 1 )
	{
		Normal = Range( 0.5, 1.0, Normal );
		return float3( 1-Normal, 1, 0 );
	}
	
	//	>1
	return float3( 0,0,1 );
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
	Depth /= DepthMax / 65535.0;
	gl_FragColor.xyz = NormalToRedGreen(Depth);

	if ( Depth == 0 )
		gl_FragColor.xyz = float3(0,0,0);
}


