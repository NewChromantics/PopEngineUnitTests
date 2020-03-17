

Pop.Gui.Timeline = class
{
	constructor(ParentWindow,Rect,GetTimelineMeta,GetTrackData)
	{
		this.GetTimelineMeta = GetTimelineMeta;
		this.GetTrackData = GetTrackData;
		this.ImageMap = new Pop.Gui.ImageMap(ParentWindow,Rect);
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
		let Tracks = [];
		for (let t = View.TrackFirst;t <= View.TrackLast;t++)
		{
			const TrackData = new Uint8Array(DataWidth);
			this.GetTrackData(View.TimeFirst,View.TimeLast,t,TrackData);
			const Track = {};
			Track.RenderHeight = 50;
			Track.Data = TrackData;
			Track.Rgb = [0.2,0.6,0.6];
			Tracks.push(Track);
		}
		const Pixels = this.MergeTrackDataToPixels(View,Tracks);

		this.ImageMapImage.WritePixels(Pixels.Width,Pixels.Height,Pixels.Data,Pixels.Format);
		this.ImageMap.SetImage(this.ImageMapImage);
	}

	MergeTrackDataToPixels(ViewMeta,Tracks)
	{
		//	add UI track
		const ScrubberTrack = this.GetScrubberTrack(ViewMeta);
		Tracks.unshift(ScrubberTrack);

		//	todo: turn this into rects to make it easier to pad
		let TotalHeight = 0;
		let BiggestWidth = 0;
		function AddHeight(Track)
		{
			BiggestWidth = Math.max(BiggestWidth,Track.Data.length);
			TotalHeight += Track.RenderHeight;
		}
		Tracks.forEach(AddHeight);

		//	turn from data to RGB
		const Pixels = {};
		Pixels.Width = BiggestWidth;
		Pixels.Height = TotalHeight;
		Pixels.Format = 'BGR';
		Pixels.Channels = 3;

		Pixels.Data = new Uint8Array(Pixels.Channels * Pixels.Width * Pixels.Height);

		//	write RGB
		let Row = 0;
		const RowStride = Pixels.Width * Pixels.Channels;
		for (let t = 0;t < Tracks.length;t++)
		{
			const Track = Tracks[t];
			const TrackData = Track.Data;
			const pi = RowStride * Row;

			for (let i = 0;i < TrackData.length;i++)
			{
				const tpi = i * Pixels.Channels;
				const Data = TrackData[i];
				const r = Track.Rgb[0] * Data;
				const g = Track.Rgb[1] * Data;
				const b = Track.Rgb[2] * Data;
				Pixels.Data[pi + tpi + 0] = b;
				Pixels.Data[pi + tpi + 1] = g;
				Pixels.Data[pi + tpi + 2] = r;
			}

			//	insert start end
			function CopyRow(SrcRow,DstRow)
			{
				const Src = SrcRow * RowStride;
				const Dst = DstRow * RowStride;
				Pixels.Data.copyWithin(Dst,Src,Src+RowStride);
			}
			for (let r = 1;r < Track.RenderHeight;r++)
			{
				CopyRow(Row,Row + r);
			}
			Row += Track.RenderHeight;
		}
		Pop.Debug("Pixels.Data",Pixels.Data);
		//	draw UI on top
		//this.WriteUIToPixels(RowPixels);
		return Pixels;
	}

	GetScrubberTrack(View)
	{
		const DataWidth = 1 + View.TimeLast - View.TimeFirst;
		const TrackData = new Uint8Array(DataWidth);
		const NotchFrequency = 10;

		for (let p = 0;p < DataWidth;p++)
		{
			const t = View.TimeFirst + p;
			const Notch = (t % NotchFrequency) == 0;
			const Alt = (t & 1) != 0;
			let Value = 0;
			if (Alt)
				Value = 50;
			if (Notch)
				Value = 200;
			TrackData[p] = Value;
		}

		const Track = {};
		Track.RenderHeight = 10;
		Track.Data = TrackData;
		Track.Rgb = [1,1,1];
		return Track;
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

function GetTrackData(TimeFirst,TimeLast,TrackIndex,TrackData)
{
	Pop.Debug(`TimeFirst ${TimeFirst} TimeLast ${TimeLast} TrackData.length ${TrackData.length}`);
	for (let i = TimeFirst;i <= TimeLast;i++)
		TrackData[i] = Math.floor(Math.random() * 255);
	TrackData[0] = 255;
	TrackData[TimeLast] = 255;
}


const TimelineRect = AllocControlRect(100);
const Timeline = new Pop.Gui.Timeline(Window,TimelineRect,GetTimelineMeta,GetTrackData);

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
