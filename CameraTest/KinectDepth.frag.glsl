precision highp float;
varying vec2 uv;

uniform sampler2D Texture;

const float DepthMax = 4500;


float3 NormalToRedGreen(float Normal)
{
	if ( Normal < 0.5 )
	{
		Normal = Normal / 0.5;
		return float3( 1, Normal, 0 );
	}
	else if ( Normal <= 1 )
	{
		Normal = (Normal-0.5) / 0.5;
		return float3( 1-Normal, 1, 0 );
	}
	
	//	>1
	return float3( 0,0,1 );
}

void main()
{
	gl_FragColor = float4(0,0,0,1);

	float2 ab = texture(Texture, uv).yx;

	float Depth = ab.x * 65280.0;
	Depth += ab.y * 256.0;
	Depth /= DepthMax;
	gl_FragColor.xyz = NormalToRedGreen(Depth);

	if ( Depth == 0 )
		gl_FragColor.xyz = float3(0,0,0);

	//gl_FragColor.xy = ab;
	/*
	gl_FragColor.z = 0;
	float Depth = ab.x * 65280.0;
	Depth += ab.y * 256.0;
	Depth /= 65535.0;
	//Depth /= DepthMax;

	Depth = 1.0 - Depth;

	gl_FragColor.xyz = NormalToRedGreen(Depth);
	*/
}


