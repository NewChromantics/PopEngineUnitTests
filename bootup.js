
//	todo: load this layout from a xib!
const Window = new Pop.Gui.Window("Pop Engine");

//const LabelRect = Window.GetScreenRect();
const LabelRect = [0,0,400,200];

const Label = new Pop.Gui.Label( Window, LabelRect );
Label.SetValue('Drag an app folder to this window to boot');

async function RunNextApp(Filename)
{
	//	relaunch this app with a new path
	const ExeName = Pop.GetExeFilename();
	const Arguments = [Filename];
	const Process = new Pop.ShellExecute(ExeName,Arguments);
	const ExitCode = await Process.WaitForExit();
	Pop.Debug(`${ExeName} exited with ${ExitCode}`);
}

async function LoadProjectLoop()
{
	while ( true )
	{
		const DroppedFilenames = await Window.WaitForDragDrop();
		const RunFilename = DroppedFilenames[0];
		
		try
		{
			await RunNextApp(RunFilename);
		}
		catch(e)
		{
			Pop.Debug(`Error running ${RunFilename}; ${e}`);
		}
		
		await Pop.Yield(1000);
	}
}
LoadProjectLoop().then().catch();
