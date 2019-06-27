//	replace this with a proper mini unit test/api example set of scripts
Pop.Debug("Virtual Reality Test");

Pop.Debug( JSON.stringify( Pop.Openhmd.EnumDevices() ) );

//	find devices
//	attach to device
//	get updates
//	render
//let Hmd = new Pop.Openvr.Hmd("Device Name");
let Hmd = new Pop.Openhmd.Hmd("OpenHmd_0");

Hmd.OnRender = function(RenderTarget,Camera)
{
	if ( Camera.Name == "Left" )
		RenderTarget.ClearColour( 1,0,0 );
	else if ( Camera.Name == "Right" )
		RenderTarget.ClearColour( 0,1,0 );
	else
		RenderTarget.ClearColour( 0,0,1 );
}


function HmdDk1(Hmd)
{
	//	create fullscreen window in the right screen
	let Screens = Pop.EnumScreens();
	Pop.Debug( JSON.stringify(Screens) );
	this.Window = new Pop.Opengl.Window()

	this.OnRender = function(RenderTarget)
	{
		let LeftMatrix = Hmd.GetEyeMatrix("Left");
		let RightMatrix = Hmd.GetEyeMatrix("Right");
		//	render to left
		//	render to right
		//	render both!
		Hmd.OnRender( RenderTarget, "Left" );
	}
	
	this.Window.OnRender = this.OnRender;
}
Hmd.Handler = new HmdDk1(Hmd);
