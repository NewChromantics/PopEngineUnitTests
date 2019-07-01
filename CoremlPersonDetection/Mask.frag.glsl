precision highp float;
varying vec2 uv;

uniform sampler2D Texture;


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
	float Mask = texture(Texture, uv).x;
	Mask = 1.0 - Mask;
	Mask = (Mask > 0.08) ? 1 : 0;
	//gl_FragColor = float4( 0, 0, 0, Mask );
	gl_FragColor = float4( NormalToRedGreen(Mask), 1-Mask );
}


