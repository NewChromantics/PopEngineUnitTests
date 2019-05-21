
let Window = new Pop.Gui.Window("Platform Native Window!");
let Slider = new Pop.Gui.Slider( Window, [0,0,100,20] );
Slider.SetMinMax( 0, 100 );
Slider.SetValue( 33 );
Slider.OnChanged = Pop.Debug;

