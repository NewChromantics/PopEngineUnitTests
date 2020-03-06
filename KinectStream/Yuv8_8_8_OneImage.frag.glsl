precision highp float;
varying vec2 uv;

uniform sampler2D LumaTexture;

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

void GetPlaneVs(out float LumaBottom,out float ChromaUBottom)
{
	//	layout is w x h luma
	//			+ w/2 x h/2 chroma u
	//			+ w/2 x h/2 chroma v
	//	in BYTES, so a row is twice as long in chroma
	float LumaWeight = 1 * 1;
	float ChromaUWeight = 0.5 * 0.5;
	float ChromaVWeight = 0.5 * 0.5;
	float TotalWeight = LumaWeight + ChromaUWeight + ChromaVWeight;
	LumaWeight /= TotalWeight;
	ChromaUWeight /= TotalWeight;
	ChromaVWeight /= TotalWeight;
	LumaBottom = LumaWeight;
	ChromaUBottom = LumaBottom + ChromaUWeight;
}

float2 GetLumaUv(float2 uv)
{
	float LumaBottom;
	float ChromaUBottom;
	GetPlaneVs( LumaBottom, ChromaUBottom);
	float u = uv.x;
	float v = mix( 0.0, LumaBottom, uv.y );
	return float2(u,v);
}


float2 GetChromaUuv(float2 uv)
{
	float LumaBottom;
	float ChromaUBottom;
	GetPlaneVs( LumaBottom, ChromaUBottom);
		
	float2 RectMin = float2(0,LumaBottom);
	float2 RectMax = float2(1,ChromaUBottom);
	
	//	gr: the chroma plane is 1/4 size (0.5*0.5)
	//		so we see 4 images side by side
	//		the ROW corresponds to the section
	//		so sample the right section.
	//		this needs to be way more pixel-perfect!
	//	quick test
	uv.x = mix( 0.0, 0.50, uv.x );
	
	uv = mix( RectMin, RectMax, uv );
	return uv;
}

float2 GetChromaVuv(float2 uv)
{
	uv = GetChromaUuv(uv);
	return uv;
}

void main()
{
	gl_FragColor = texture2D( LumaTexture, uv );
	return;


	float2 Lumauv = GetLumaUv(uv);
	float2 ChromaUuv = GetChromaUuv(uv);
	float2 ChromaVuv = GetChromaVuv(uv);

	float Luma = texture2D( LumaTexture, Lumauv ).x;
	//Luma = 0.5;
	float ChromaU = texture2D( LumaTexture, ChromaUuv ).x;
	float ChromaV = texture2D( LumaTexture, ChromaVuv ).x;
	gl_FragColor.xyz = LumaChromaToRgb( Luma, float2(ChromaU,ChromaV) );
	gl_FragColor.xyz = float3(ChromaU,ChromaU,ChromaV);
	gl_FragColor.xyz = float3(ChromaV,ChromaV,ChromaU);
	gl_FragColor.w = 1;
	//gl_FragColor = texture2D( LumaTexture, Lumauv );
}

