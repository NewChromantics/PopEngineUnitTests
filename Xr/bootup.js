

function SetupXrDevice(Device)
{
	Pop.Debug("New device",Device);
	Device.OnRender = RenderEye;
}

function RenderEye(RenderTarget,Camera)
{
	if ( Camera.Name == 'Left' )
		RenderTarget.ClearColour( 0,0.5,1 );
	else if ( Camera.Name == 'Right' )
		RenderTarget.ClearColour( 1,0,0 );
	else
		RenderTarget.ClearColour( 0,0,1 );
}


function RenderWindow(RenderTarget)
{
	RenderTarget.ClearColour( 0,1,0 );
}

//	todo: attrib	{xrCompatible: true}, but working with mozilla's emulator...
let Window = new Pop.Opengl.Window("xr");
Window.OnRender = RenderWindow;
Window.OnMouseMove = function () { };

async function XrLoop()
{
	//	this just keeps looping and creates a new device whenever one appears
	while( true )
	{
		const NewDevice = await Pop.Xr.CreateDevice( Window );
		SetupXrDevice( NewDevice );
	}
}

//	app loop
XrLoop().then().catch(Pop.Debug);

