let Window = new Pop.Gui.Window("Platform Native Window!");


const TestLabel1 = new Pop.Gui.Label(Window,'TestLabel1');
TestLabel1.SetText('Label from js');
async function CounterLabelThread()
{
	let Counter = 0;
	while(true)
	{
		await Pop.Yield(1);
		TestLabel1.SetText(`Label counter ${Counter}`);
		Counter++;
	}
}
CounterLabelThread()

const FrameCounterLabel = new Pop.Gui.Label(Window,'FrameCounterLabel');

/*
const TestButton1 = new Pop.Gui.Button(Window,'TestButton1');
TestButton1.OnClicked = function()
{
	Pop.Debug('Test Button1 clicked!');
	this.SetText('New button label');
}

const TestButton2 = new Pop.Gui.Button(Window,'TestButton2');
TestButton2.OnClicked = function()
{
	Pop.Debug(`Test Button2 clicked!`);
	this.SetText('New button label2');
}

const TestTickBox1 = new Pop.Gui.TickBox(Window,'TestTickBox1');
TestTickBox1.SetValue(true);
TestTickBox1.SetText(`New tickbox label: ${TestTickBox1.GetValue()}`);
TestTickBox1.OnChanged = function(NewValue)
{
	Pop.Debug(`js: TestTickBox1 now ${NewValue}`);
	TestTickBox1.SetText(`now ${NewValue}`);
}
*/

const Sokol = new Pop.Sokol.Context(Window, "TestRenderView");
async function RenderLoop()
{
	let FrameCounter = 0;
	function GetRenderCommands()
	{
		const Commands = [];
		const Blue = (FrameCounter % 60)/60;
		//Commands.push(['SetRenderTarget', null]);
		Commands.push(['Clear',1,0,Blue]);
		return Commands;
	}

	while (Sokol)
	{
		try
		{
			const Commands = GetRenderCommands();
			await Sokol.Render(Commands);
			FrameCounter++;
			FrameCounterLabel.SetText(`Frame ${FrameCounter}`);
		}
		catch(e)
		{
			Pop.Warning(e);
			await Pop.Yield(1000);
		}
	}
}
RenderLoop().catch(FrameCounterLabel.SetText.bind(FrameCounterLabel));

/*
let Slider = new Pop.Gui.Slider( Window, [0,0,600,40] );
let Label = new Pop.Gui.Label( Window, [0,40,600,30] );
Label.SetValue("Hello #");
Slider.SetMinMax( 0, 100 );
Slider.SetValue( 33 );
Slider.OnChanged = function(Value)
{
	Label.SetValue("Hello " + Value);
}

let Slider2 = new Pop.Gui.Slider( Window, [0,80,600,10] );
Slider2.SetMinMax( 0, 100 );
Slider2.OnChanged = function(Value)
{
	Slider.SetValue(Value);
	Slider.OnChanged(Value);
}

let TickBox = new Pop.Gui.TickBox( Window, [0,90,600,80] );
TickBox.SetValue(false);
TickBox.OnChanged = function(Value)
{
	TickBox.SetLabel("Tickbox = " + Value);
}



let Colour = [1,0.5,0.1];
const ColourLabel = new Pop.Gui.Label( Window, [0,200,300,30] );
const ColourBox = new Pop.Gui.Colour(Window,[0,230,300,40]);
ColourBox.SetValue(Colour);
ColourBox.OnChanged = function(Value)
{
	//	replace colour values (doing = messes up the mapping below?)
	Colour.splice( 0, Colour.length, ...Value );
	const ColourString = Colour.map( f=>f.toFixed(3) ).join(', ');
	ColourLabel.SetValue(`Rgb = ${ColourString}`);
}
//	init label
ColourBox.OnChanged(Colour);



*/
function NormalToRedGreenBlue(Normal)
{
	function Range(Min,Max,Value)
	{
		return (Value-Min) / (Max-Min);
	}
	function float3(x,y,z)
	{
		return [x,y,z];
	}
	
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


function MakeRainbowImage(Width,Height)
{
	const Pixels = new Pop.Image();
	const Format = 'RGB';
	const PixelBuffer = new Uint8Array( Width * Height * 3 );
	for ( let i=0;	i<PixelBuffer.length; i+=3 )
	{
		const f = i/PixelBuffer.length;
		const rgb = NormalToRedGreenBlue(f);
		PixelBuffer[i+0] = rgb[0] * 255;
		PixelBuffer[i+1] = rgb[1] * 255;
		PixelBuffer[i+2] = rgb[2] * 255;
	}
	Pixels.WritePixels( Width, Height, PixelBuffer, Format );
	return Pixels;
}

const RainbowPixels = MakeRainbowImage(200,200);
//const Image = new Pop.Gui.ImageMap(Window,[0,270,Pixels.GetWidth(),Pixels.GetHeight()]);
//Image.SetImage(RainbowPixels);

/*
const ImageGui = new Pop.Gui.ImageMap(Window,"TestImageView");
ImageGui.SetImage(RainbowPixels);
ImageGui.SetVisible(false);
*/

async function AddSubWindowIcons()
{
	const GridView = new Pop.Gui.Window('ArtifactThumbnails');
	
	for ( let i=0;	i<10;	i++ )
	{
		const Rect = [20,20,60+(i*5),200];
		//const Icon = new Pop.Gui.ImageMap(GridView, Rect );
		//Icon.SetImage(RainbowPixels);
		const Icon = new Pop.Gui.Button(GridView, Rect );
		//Icon.SetImage(RainbowPixels);
		
		const Style = {};
		Style.Visible = (i % 2)==0;
		Icon.SetStyle(Style);
		
		//const Icon = new Pop.Gui.Label(GridView,[0,0,100,100]);
		Icon.SetText(`Label ${i}`);
		Icon.OnClicked = function() {	Pop.Debug(`Clicked ${i}`);	};
	}
}

AddSubWindowIcons().catch(Pop.Warning);


const StyleRed = {};
StyleRed.Colour = [255,0,0,0];
const StyleGreen = {};
StyleGreen.Colour = [0,255,0];
const ButtonAsLabel1 = new Pop.Gui.TickBox(Window,'ArIsTrackingLabel');
const InitialValue = ButtonAsLabel1.GetValue();
ButtonAsLabel1.SetText(`Initial value=${InitialValue}`);
//ButtonAsLabel1.SetValue(true);
ButtonAsLabel1.OnChanged = function(Value)	
{	
	ButtonAsLabel1.SetStyle(StyleGreen);
	this.SetText(`Button2=${Value}`);	
}
ButtonAsLabel1.SetStyle(StyleRed);


const ButtonAsLabel2 = new Pop.Gui.TickBox(Window,'RecordButton');
ButtonAsLabel2.SetValue(false);
ButtonAsLabel2.OnChanged = function(Value)	
{	
	//this.SetText(`Button2=${Value}`);	
}


