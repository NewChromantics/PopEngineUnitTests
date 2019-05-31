
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
let TickLabel = new Pop.Gui.Label( Window, [0,200,600,30] );
TickBox.SetValue(false);
TickBox.OnChanged = function(Value)
{
	TickLabel.SetValue("Tickbox = " + Value);
}

