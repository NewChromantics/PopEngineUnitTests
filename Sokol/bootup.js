Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('../PopEngineCommon/PopFrameCounter.js');


const Window = new Pop.Gui.Window("Sokol Test");

const Sokol = new Pop.Sokol.Context(Window, "GLView");

let FrameCounter = 0;
const FrameRateCounter = new Pop.FrameCounter('Render');

function GetRenderCommands()
{
	const Commands = [];
	const Blue = (FrameCounter % 60)/60;
	Commands.push(['Clear',1,0,Blue]);
	return Commands;
}

async function RenderLoop()
{
	while (Sokol)
	{
		//	submit frame for next paint
		const Commands = GetRenderCommands();
		//Pop.Debug(`Render ${FrameCounter}`);
		await Sokol.Render(Commands);
		FrameCounter++;
		FrameRateCounter.Add();
	}
}
RenderLoop().catch(Pop.Warning);


