//	"C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.24.28314\bin\Hostx64\x64\cl.exe" Depth16ToYuv.c /FeDepth16ToYuv.dll /O2 /link /LIBPATH:"C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.24.28314\lib\x64" /LIBPATH:"D:\Windows Kits\10\Lib\10.0.18362.0\um\x64" /DLL /LIBPATH:"D:\Windows Kits\10\Lib\10.0.18362.0\ucrt\x64"
#define EXPORT	__declspec( dllexport )

typedef unsigned short uint16_t;
typedef unsigned char uint8_t;

int Floor(float f)
{
	return (int)f;
}

int Min(int a, int b)
{
	return (a < b) ? a : b;
}

float Range(float Min, float Max, float Value)
{
	return (Value - Min) / (Max - Min);
}

float RangeClamped(float Min, float Max, float Value)
{
	float f = Range(Min, Max, Value);
	if (f < 0)
		return 0;
	if (f > 1)
		return 1;
	return f;
}

int GetChromaIndex(int Depthx, int Depthy, int LumaWidth)
{
	int ChromaWidth = LumaWidth / 2;
	//	this is more complicated than one would assume
	//	we need the TEXTURE BUFFER index we're writing to;
	//	each TEXTURE row is 2x pixel rows as the chroma width is half, but
	//	the luma width is the same, so chroma buffer looks like this
	//	ROW1ROW2
	//	ROW3ROW4
	int ChromaX = (Depthx / 2);
	int ChromaY = (Depthy / 2);
	int Left = (ChromaY % 2) == 0;

	int WriteX = Left ? ChromaX : ChromaX + ChromaWidth;
	int WriteY = (ChromaY / 2);

	int WriteIndex = WriteX + (WriteY * LumaWidth);
	return WriteIndex;
}

struct float2
{
	float x;
	float y;
};

struct uint8_2
{
	uint8_t x;
	uint8_t y;
};

EXPORT void Depth16ToYuv(uint16_t* Depth16Plane, uint8_t* Yuv8_8_8Plane, int Width, int Height, int DepthMin, int DepthMax)
{
	int LumaSize = Width * Height;
	int LumaWidth = Width;
	int ChromaWidth = Width / 2;
	int ChromaHeight = Height / 2;
	int ChromaSize = ChromaWidth * ChromaHeight;
	int DepthSize = Width * Height;
	int YuvSize = LumaSize + ChromaSize + ChromaSize;

#define RangeCount  5
	struct float2 UvRanges[RangeCount] = { {0,0}, {0.25,0.25}, {0.5,0.5}, {0.75,0.75}, {1,1} };
	uint8_t URange8s[RangeCount] = { 0,64,128,196,255 };
	uint8_t VRange8s[RangeCount] = { 0,64,128,196,255 };
	int RangeLengthMin1 = RangeCount - 1;

	for (int i = 0; i < DepthSize; i++)
	{
		int x = i % Width;
		int y = i / Width;
		int DepthIndex = i;
		int Depth16 = Depth16Plane[DepthIndex];
		int LumaIndex = DepthIndex;
		int ChromaUIndex = LumaSize + GetChromaIndex(x, y, LumaWidth);
		int ChromaVIndex = LumaSize + ChromaSize + GetChromaIndex(x, y, LumaWidth);

		if (ChromaUIndex >= YuvSize || ChromaVIndex >= YuvSize)
			continue;

		float Depthf = RangeClamped(DepthMin, DepthMax, Depth16);
		//float Depthf = Range( DepthMin, DepthMax, Depth16 );

		float DepthScaled = Depthf * (float)RangeLengthMin1;
		int RangeIndex = Floor(DepthScaled);
		//	float Remain = DepthScaled - RangeIndex;
		float Remain = DepthScaled - Floor(DepthScaled);
		RangeIndex = Min(RangeIndex, RangeLengthMin1);

		/*
				//	make luma go 0-1 1-0 0-1 so luma image wont have edges for compression
				if (Params.PingPongLuma)
					if (RangeIndex & 1)
						Remain = 1 - Remain;
		*/

		//	something wrong with RangeIndex, manually setting an index works
		//	but ANYTHING calculated seems to result in 0
		uint8_t Luma = Remain * 255.f;
		//uint8_t Luma = min(Depthf * 255.f,255);

		Yuv8_8_8Plane[LumaIndex] = Luma;
		Yuv8_8_8Plane[ChromaUIndex] = URange8s[RangeIndex];
		Yuv8_8_8Plane[ChromaVIndex] = VRange8s[RangeIndex];
	}
}
