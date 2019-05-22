
let Window = new Pop.Gui.Window("Platform Native Window!");
let Slider = new Pop.Gui.Slider( Window, [0,0,9999,80] );
Slider.SetMinMax( 0, 100 );
Slider.SetValue( 33 );
Slider.OnChanged = Pop.Debug;

let Slider2 = new Pop.Gui.Slider( Window, [0,50,9999,20] );
Slider2.SetMinMax( 0, 100 );
Slider2.OnChanged = function(Value)
{
	Slider.SetValue(Value);
}
