//	replace this with a proper mini unit test/api example set of scripts

Pop.Debug("Hello World");

let Colour = 0;

function OnRender(RenderTarget)
{
	let Red = Colour & 0xff;
	let Green = (Colour >> 8) & 0xff;
	let Blue = (Colour >> 16) & 0xff;
	RenderTarget.ClearColour(Red/256, Green/256, Blue/256);
}

let Window = new Pop.Opengl.Window("A Pop Engine window!");
Window.OnRender = OnRender;

async function Loop()
{
	while(true)
	{
		await Pop.Yield(10);
		Colour++;
		Pop.Debug(Colour);
		let Red = Colour & 0xff;
		let Green = (Colour >> 8) & 0xff;
		let Blue = (Colour >> 16) & 0xff;
		Pop.Debug( Red, Green, Blue );
	}
}

function OnError(Error)
{
	Pop.Debug("Error: " + Error);
	//	blue
	Colour = 0xff << 16;
}

Loop().catch( OnError );
