precision highp float;
varying vec2 uv;

uniform sampler2D LumaTexture;
uniform sampler2D ChromaUTexture;
uniform sampler2D ChromaVTexture;

const float ChromaVRed = 1.5958;
const float ChromaUGreen = -0.39173;
const float ChromaVGreen = -0.81290;
const float ChromaUBlue = 2.017;
const float LumaMin = 16.0;
const float LumaMax = 253.0;


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



float3 LumaChromaToRgb(float Luma,float2 Chroma)
{
	float3 Rgb;
	
	//	0..1 to -0.5..0.5
	Luma = mix( LumaMin/255.0, LumaMax/255.0, Luma );
	Chroma -= 0.5;
	
	Rgb.x = Luma + (ChromaVRed * Chroma.y);
	Rgb.y = Luma + (ChromaUGreen * Chroma.x) + (ChromaVGreen * Chroma.y);
	Rgb.z = Luma + (ChromaUBlue * Chroma.x);
	
	Rgb = max( float3(0,0,0), Rgb );
	Rgb = min( float3(1,1,1), Rgb );

	return Rgb;
}

const bool DebugEverything = false;

float3 GetRgb_Debug()
{
	float4 Sample = texture2D( LumaTexture, uv );
	return NormalToRedGreenBlue(Sample.x);
}

void main()
{
	gl_FragColor.w = 1.0;

	if ( DebugEverything )
	{
		gl_FragColor.xyz = GetRgb_Debug();
		return;
	}
	
	float2 Sampleuv = uv;
	
	float Luma = texture2D( LumaTexture, Sampleuv ).x;
	float ChromaU = texture2D( ChromaUTexture, Sampleuv ).x;
	float ChromaV = texture2D( ChromaVTexture, Sampleuv ).x;
	float2 ChromaUv = float2(ChromaU,ChromaV);

	gl_FragColor.xyz = LumaChromaToRgb( Luma, ChromaUv);
	//gl_FragColor.xyz = float3(Luma,Luma,Luma);
	//gl_FragColor.xyz = float3(ChromaU,ChromaU,ChromaU);
	gl_FragColor.w = 1.0;
}


