

Pop.Gui.Timeline = class
{
	constructor(ParentWindow,Rect,GetTimelineMeta,GetTimelineData)
	{
		this.ImageMap = new Pop.Gui.ImageMap(ParentWindow,Rect);
		const Meta = GetTimelineMeta();
		this.ImageMapImage = new Pop.Image();
		this.UpdatePixels();
	}

	GetViewSize()
	{
		const ViewMeta = {};
		ViewMeta.TimeFirst = 0;
		ViewMeta.TimeLast = 100;
		ViewMeta.TrackFirst = 0;
		ViewMeta.TrackLast = 0;
		return ViewMeta;
	}

	UpdatePixels()
	{
		const View = this.GetViewSize();

		//	fetch data in view
		const DataWidth = 1 + View.TimeLast - View.TimeFirst;
		let TrackDatas = [];
		for (let t = View.TrackFirst;t <= View.TrackLast;t++)
		{
			const TrackData = new Uint8Array(DataWidth);
			GetTimelineData(View.TimeFirst,View.TimeLast,t,TrackData);
			TrackDatas.push(TrackData);
		}
		const Pixels = this.MergeTrackDataToPixels(View,TrackDatas);

		this.ImageMapImage.WritePixels(Pixels.Width,Pixels.Height,Pixels.Data,Pixels.Format);
		this.ImageMap.SetImage(this.ImageMapImage);
	}

	MergeTrackDataToPixels(ViewMeta,TrackDatas)
	{
		//	turn from data to RGB
		const Pixels = {};
		Pixels.Width = TrackDatas[0].length;
		Pixels.Height = TrackDatas.length;
		Pixels.Format = 'BGR';
		Pixels.Channels = 3;

		Pixels.Data = new Uint8Array(Pixels.Channels * Pixels.Width * Pixels.Height);

		//	write RGB
		for (let t = 0;t < TrackDatas.length;t++)
		{
			const pi = Pixels.Width * Pixels.Channels * t;
			const TrackData = TrackDatas[t];
			for (let i = 0;i < TrackData.length;i++)
			{
				const ti = i * 3;
				const Data = TrackData[i];
				Pixels.Data[pi + ti + 0] = Data;
				Pixels.Data[pi + ti + 1] = 0;
				Pixels.Data[pi + ti + 2] = 0;
			}
		}
		Pop.Debug("Pixels.Data",Pixels.Data);
		//	draw UI on top
		//this.WriteUIToPixels(RowPixels);
		return Pixels;
	}

	GetScrubberTrackData(ViewMeta)
	{
	}

	WriteUIToPixels(Pixels)
	{
		//	draw mouse pos, selection pos
	}
}



const WindowRect = [100,100,400,400];
const Window = new Pop.Gui.Window("Timeline",WindowRect,false);

const ControlRectPadding = 5;
let ControlRectBottom = 0;
function AllocControlRect(Height)
{
	//	fill
	if (!Height)
		Height = WindowRect[3] - ControlRectBottom;
	//	overflowed space
	if (Height < 0)
		Height = WindowRect[3] / 2;

	//	temp to get around scrollbar
	const RightPad = 30 + ControlRectPadding;

	const Top = ControlRectBottom + ControlRectPadding;
	const Bottom = Top + Height;
	const Left = ControlRectPadding;
	const Right = WindowRect[2] - ControlRectPadding - RightPad;
	ControlRectBottom = Bottom;

	return [Left,Top,Right - Left,Bottom - Top];
}


const LabelRect = AllocControlRect(20);
const Label = new Pop.Gui.Label(Window,LabelRect);
Label.SetValue("Hello");


function GetTimelineMeta()
{
	const Meta = {};
	Meta.TimeMin = 0;
	Meta.TimeMax = 100;
	Meta.Tracks = 1;
	return Meta;
}

function GetTimelineData(TimeFirst,TimeLast,TrackIndex,TrackData)
{
	for (let i = TimeFirst;i <= TimeLast;i++)
		TrackData[i] = Math.floor(Math.random() * 255);
	TrackData[0] = 255;
	TrackData[TimeLast] = 255;
}


const TimelineRect = AllocControlRect(0);
const Timeline = new Pop.Gui.Timeline(Window,TimelineRect,GetTimelineMeta,GetTimelineData);

const ImageMapRect = AllocControlRect(0);
const ImageMap = new Pop.Gui.ImageMap(Window,ImageMapRect);




async function ImageMapLoop()
{
	let Pixels = new Pop.Image('cat.jpeg');
	let CursorMap = [0,1,2,3];	//	2x2
	const CursorMapPixels = new Pop.Image();
	CursorMapPixels.WritePixels(2,2,CursorMap,'Greyscale');
	ImageMap.SetImage(Pixels);
	ImageMap.SetCursorMap(CursorMapPixels,['Hand','Help','NotAllowed','Wait']);

	while (ImageMap)
	{
		const Event = await ImageMap.WaitForMouseEvent();

		Pop.Debug("Image map event",JSON.stringify(Event));
	}
}
ImageMapLoop().then(Pop.Debug).catch(Pop.Debug);
