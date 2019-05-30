
let Window = new Pop.Gui.Window("Platform Native Window!");
let Slider = new Pop.Gui.Slider( Window, [0,0,9999,80] );
let Label = new Pop.Gui.Label( Window, [0,80,9999,30] );
Label.SetValue("Hello #");
Slider.SetMinMax( 0, 100 );
Slider.SetValue( 33 );
Slider.OnChanged = function(Value)
{
	Label.SetValue("Hello " + Value);
}

let Slider2 = new Pop.Gui.Slider( Window, [0,50,9999,20] );
Slider2.SetMinMax( 0, 100 );
Slider2.OnChanged = function(Value)
{
	Slider.SetValue(Value);
}

let TickBox = new Pop.Gui.TickBox( Window, [0,120,9999,80] );
let TickLabel = new Pop.Gui.Label( Window, [0,200,9999,30] );
TickBox.SetValue(false);
TickBox.OnChanged = function(Value)
{
	TickLabel.SetValue("Tickbox = " + Value);
}

