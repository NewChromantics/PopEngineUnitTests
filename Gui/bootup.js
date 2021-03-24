let Window = new Pop.Gui.Window("TestAppWindow");

//let Renderer = new Pop.Sokol.Context(Window,'TestRenderView');


async function CreateRenderContext()
{
	for ( let i=0;	i<100;	i++ )
	{
		try
		{
			const ViewWindow = Window;
			const ViewName = "TestRenderView";
			//const Window = (Ios ? AppWindow : null) || new Pop.Gui.Window("PopCap Window");
			const Sokol = new Pop.Sokol.Context(ViewWindow,ViewName);
			return Sokol;
		}
		catch(e)
		{
			Pop.Debug(`Failed to make render context; ${e}...`);
			await Pop.Yield(100);
		}
	}
	throw `Couldn't make render context`;
}

async function SokolRenderThread()
{
	//	new sokol renderer
	const RenderThrottleMs = 40;
	const Sokol = await CreateRenderContext();

	let FrameCount = 0;
	//const FrameRateCounter = new FrameCounter('Render');
		
	
	function GetRenderCommands()
	{
		let Commands = [];
		const Blue = (FrameCount % 60)/60;
		Commands.push(['Clear',0,Blue,1]);
		/*
		if ( CloudRenderer )
		{
			const RenderCommands = CloudRenderer.GetRenderCommands();
			Commands.push(...RenderCommands);
		}
		else if ( ThumbnailRenderer )
		{
			const RenderCommands = ThumbnailRenderer.GetRenderCommands();
			Commands.push(...RenderCommands);
		}
		*/
		Commands = Commands.filter( c => c!=null );
		return Commands;
	}
	/*
	async function CreateAssets(RenderContext)
	{
		if ( ThumbnailRenderer )
			await ThumbnailRenderer.LoadAssets(RenderContext);
		if ( CloudRenderer )
			await CloudRenderer.LoadAssets(RenderContext);
	}
	*/
	while (Sokol)
	{
		Pop.Debug("Wait for render");
		await Pop.Yield(RenderThrottleMs);
		try
		{
			Pop.Debug("Render!");
			//await CreateAssets(Sokol);
		
			//	submit frame for next paint
			const Commands = GetRenderCommands();
			//Pop.Debug(`Render ${FrameCounter} Commands=${Commands} Sokol=${Sokol}`);
			await Sokol.Render(Commands);
			Pop.Debug("Render complete");
			FrameCount++;
			//if ( Params.EnableFrameCounter )
			//	FrameRateCounter.Add();
		}
		catch(e)
		{
			Pop.Debug(`Renderloop error; ${e}`);
			await Pop.Yield(1000);
		}
	}
}
SokolRenderThread().catch(Pop.Warning);

