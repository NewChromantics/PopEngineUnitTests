//	replace this with a proper mini unit test/api example set of scripts
Pop.Debug("Virtual Reality Test");


//	find devices
//	attach to device
//	get updates
//	render
let Hmd = new Pop.Openvr.Hmd("Device Name");

Hmd.OnRender = function(RenderTarget,Camera)
{
	if ( Camera.Name == "Left" )
		RenderTarget.ClearColour( 1,0,0 );
	else if ( Camera.Name == "Right" )
		RenderTarget.ClearColour( 0,1,0 );
	else
		RenderTarget.ClearColour( 0,0,1 );
}
