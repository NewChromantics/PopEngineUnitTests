

const WindowRect = [100,100,400,400];
const Window = new Pop.Gui.Window("Timeline",WindowRect,false);
const LabelRect = [0,0,WindowRect[2],WindowRect[3]/3];
const Label = new Pop.Gui.Label(Window,LabelRect);
Label.SetValue("Hello #");

const ImageMapTop = LabelRect[1] + LabelRect[3];
const ImageMapHeight = WindowRect[3] - ImageMapTop;
const ImageMapRect = [0,ImageMapTop,WindowRect[2],ImageMapHeight];
const ImageMap = new Pop.Gui.ImageMap(Window,ImageMapRect);

async function ImageMapLoop()
{
	let Pixels = new Pop.Image('cat.jpeg');
	let CursorMap = [0,1,2,3];	//	2x2
	const CursorMapPixels = new Pop.Image();
	CursorMapPixels.WritePixels(2,2,CursorMap,'Greyscale');
	//ImageMap.SetImage(Pixels);
	ImageMap.SetCursorMap(CursorMapPixels,['Hand','Help','NotAllowed','Wait']);

	while (ImageMap)
	{
		const Event = await ImageMap.WaitForMouseEvent();

		Pop.Debug("Image map event",JSON.stringify(Event));
	}
}
ImageMapLoop().then(Pop.Debug).catch(Pop.Debug);
