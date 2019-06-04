precision highp float;
varying vec2 uv;

uniform sampler2D TextureA;
uniform sampler2D TextureB;

//	not expecting a huge amount
const float MaxDiff = 0.1;

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

float GetDiff(float a,float b)
{
	float Diff = abs( a - b );
	return Diff;
}

float GetDiff3(float3 a,float3 b)
{
	float x = GetDiff(a.x,b.x);
	float y = GetDiff(a.y,b.y);
	float z = GetDiff(a.z,b.z);
	
	//	average? or max
	return max( x, max( y, z ) );
}

void main()
{
	float3 SampleA = texture2D( TextureA, uv ).xxx;
	float3 SampleB = texture2D( TextureB, uv ).xxx;
	float Diff = GetDiff3( SampleA, SampleB );
	
	Diff /= MaxDiff;
	
	gl_FragColor.xyz = NormalToRedGreen( Diff );
	gl_FragColor.w = 1;
}


