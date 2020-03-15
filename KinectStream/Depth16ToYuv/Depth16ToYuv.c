//	using WasmFiddle to compile & test
//	https://wasdk.github.io/WasmFiddle/?ayngq

typedef unsigned short uint16_t;
typedef unsigned char uint8_t;


int Depth16ToYuv(uint16_t* Depth16Plane, uint8_t* Depth8Plane, int Width, int Height)
{
	int Total = 0;
	int DepthSize = Width * Height;
	for (int i = 0; i < DepthSize; i++)
	{
		int x = i % Width;
		int y = i / Width;
		int Depth16 = Depth16Plane[i];
		float Depthf = Depth16 / (float)(1 << 16);
		int Depth8 = Depthf * 255.f;
		//Depth8Plane[i] = 99;
		Depth8Plane[i] = Depth8;
		Total += Depth16;
	}
	return Total;
}
