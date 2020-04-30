precision highp float;
varying vec2 uv;

uniform sampler2D LumaTexture;
uniform int TextureHeight;
uniform float TextureWidth;

const float ChromaVRed = 1.5958;
const float ChromaUGreen = -0.39173;
const float ChromaVGreen = -0.81290;
const float ChromaUBlue = 2.017;
const float LumaMin = 16.0;
const float LumaMax = 253.0;


float Range(float Min, float Max, float Value)
{
	return (Value - Min) / (Max - Min);
}

float3 NormalToRedGreenBlue(float Normal)
{
	if (Normal < 0)
	{
		return float3(0, 0, 0);
	}
	else if (Normal < 0.25)
	{
		Normal = Range(0.0, 0.25, Normal);
		return float3(1, Normal, 0);
	}
	else if (Normal <= 0.5)
	{
		Normal = Range(0.25, 0.50, Normal);
		return float3(1.0 - Normal, 1, 0);
	}
	else if (Normal <= 0.75)
	{
		Normal = Range(0.50, 0.75, Normal);
		return float3(0, 1, Normal);
	}
	else if (Normal <= 1)
	{
		Normal = Range(0.75, 1.00, Normal);
		return float3(0, 1.0 - Normal, 1);
	}

	//	>1
	return float3(1, 1, 1);
}

float3 LumaChromaToRgb(float Luma, float2 Chroma)
{
	float3 Rgb;

	//	0..1 to -0.5..0.5
	Luma = mix(LumaMin / 255.0, LumaMax / 255.0, Luma);
	Chroma -= 0.5;

	Rgb.x = Luma + (ChromaVRed * Chroma.y);
	Rgb.y = Luma + (ChromaUGreen * Chroma.x) + (ChromaVGreen * Chroma.y);
	Rgb.z = Luma + (ChromaUBlue * Chroma.x);

	Rgb = max(float3(0, 0, 0), Rgb);
	Rgb = min(float3(1, 1, 1), Rgb);

	return Rgb;
}

void GetPlaneVs(out float LumaBottom)
{
	//	layout is w x h luma
	//			+ w x h/2 chroma u,v
	//	in BYTES, so a row is twice as long in chroma
	float LumaWeight = 1 * 1;
	float ChromaUVWeight = 1 * 0.5;
	float TotalWeight = LumaWeight + ChromaUVWeight;
	LumaWeight /= TotalWeight;
	ChromaUVWeight /= TotalWeight;
	LumaBottom = LumaWeight;
}

float2 GetLumaUv(float2 uv)
{
	float LumaBottom;
	GetPlaneVs(LumaBottom);
	float u = uv.x;
	float v = mix(0.0, LumaBottom, uv.y);
	return float2(u, v);
}


void GetChromaUvs(float2 uv,out float2 Uuv,out float2 Vuv)
{
	float LumaBottom;
	GetPlaneVs(LumaBottom);

	//	gr: chroma uv is just uv in the chroma plane,
	//		but we need a pixel perfect uv for the two components;
	//	UVUVUVUVUV
	//	x = total of u and v, so the even ones are u, odd v
	float ChromaWidth = TextureWidth / 2.0;
	float TexelWidth = 1.0 / TextureWidth;
	float x = floor(uv.x * ChromaWidth);
	Uuv.x = (x / ChromaWidth) + 0;
	Vuv.x = (x / ChromaWidth) + TexelWidth;

	Uuv.y = mix(LumaBottom, 1.0, uv.y);
	Vuv.y = Uuv.y;
}


float3 GetChromaUvDebug(float2 uv)
{
	return float3(0, 0, 0);
}

float2 GetChromaUuv(float2 uv)
{
	float2 U;
	float2 V;
	GetChromaUvs(uv, U, V);
	return U;
}

float2 GetChromaVuv(float2 uv)
{
	float2 U;
	float2 V;
	GetChromaUvs(uv, U, V);
	return V;
}


const bool DebugEverything = false;
const bool DebugLuma = false;
const bool DebugChromaU = false;
const bool DebugChromaV = false;
const bool DebugChromaUv = false;

float3 GetRgb_Debug()
{
	float4 Sample = texture2D(LumaTexture, uv);
	return NormalToRedGreenBlue(Sample.x);
}

void main()
{
	float2 Sampleuv = uv;// / 2;
	gl_FragColor.w = 1;

	if (DebugEverything)
	{
		gl_FragColor.xyz = GetRgb_Debug();
		return;
	}

	if (DebugChromaUv && uv.x < 0.2)
	{
		gl_FragColor.xyz = GetChromaUvDebug(Sampleuv);
		return;
	}

	float2 Lumauv = GetLumaUv(Sampleuv);
	float2 ChromaUuv = GetChromaUuv(Sampleuv);
	float2 ChromaVuv = GetChromaVuv(Sampleuv);

	float Luma = texture2D(LumaTexture, Lumauv).x;
	//Luma = 0.5;
	float ChromaU = texture2D(LumaTexture, ChromaUuv).x;
	float ChromaV = texture2D(LumaTexture, ChromaVuv).x;

	if (DebugLuma)
	{
		gl_FragColor.xyz = NormalToRedGreenBlue(Luma);
		return;
	}

	if (DebugChromaU)
	{
		gl_FragColor.xyz = NormalToRedGreenBlue(ChromaU);
		return;
	}

	if (DebugChromaV)
	{
		gl_FragColor.xyz = NormalToRedGreenBlue(ChromaV);
		return;
	}

	//gl_FragColor.xyz = float3(ChromaU,ChromaU,ChromaV);
	//gl_FragColor.xyz = float3(ChromaV,ChromaV,ChromaU);
	//gl_FragColor = texture2D( LumaTexture, Lumauv );

	gl_FragColor.xyz = LumaChromaToRgb(Luma, float2(ChromaU, ChromaV));
}


