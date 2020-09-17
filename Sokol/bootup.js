Pop.Debug("Hello World")

Pop.Debug(Pop.Sokol)

const Window = new Pop.Gui.Window("Sokol Test");

const Sokol = new Pop.Sokol.Context(Window, "GLView");

let Counter = 0;
function GetRenderCommands()
{
	const Commands = [];
	const Blue = (Counter % 60)/60;
	Commands.push(['Clear',1,0,Blue]);
	return Commands;
}

async function RenderLoop()
{
	while (Sokol)
	{
		//	submit frame for next paint
		const Commands = GetRenderCommands();
		Pop.Debug(`Render ${Counter}`);
		await Sokol.Render(Commands);
		Counter++;
	}
}
RenderLoop();


