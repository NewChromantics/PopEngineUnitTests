
let Window = new Pop.Gui.Window("Platform Native Window!");
let Slider = new Pop.Gui.Slider( Window, [0,0,600,80] );
let Label = new Pop.Gui.Label( Window, [0,80,600,30] );
Label.SetValue("Hello #");
Slider.SetMinMax( 0, 100 );
Slider.SetValue( 33 );
Slider.OnChanged = function(Value)
{
	Label.SetValue("Hello " + Value);
}

let Slider2 = new Pop.Gui.Slider( Window, [0,110,600,10] );
Slider2.SetMinMax( 0, 100 );
Slider2.OnChanged = function(Value)
{
	Slider.SetValue(Value);
	Slider.OnChanged(Value);
}

let TickBox = new Pop.Gui.TickBox( Window, [0,120,600,80] );
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

