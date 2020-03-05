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

void main()
{
	float2 Sampleuv = uv;
	
	float Luma = texture2D( LumaTexture, Sampleuv ).x;
	float2 ChromaUv = float2(Luma,1.0-Luma);

	gl_FragColor.xyz = LumaChromaToRgb( Luma, ChromaUv);
	gl_FragColor.w = 1.0;
}


