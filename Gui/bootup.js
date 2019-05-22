
let Window = new Pop.Gui.Window("Platform Native Window!");
let Slider = new Pop.Gui.Slider( Window, [0,0,9999,80] );
let Label = new Pop.Gui.TextBox( Window, [0,80,9999,30] );
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
