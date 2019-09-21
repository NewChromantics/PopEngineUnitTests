

function SetupXrDevice(Device)
{
	Pop.Debug("New device",Device);
}


function RenderWindow(RenderTarget)
{
	RenderTarget.ClearColour( 0,0,1 );
}

//	todo: attrib
//	xrCompatible: true
let Window = new Pop.Opengl.Window("xr");
Window.OnRender = RenderWindow;

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

