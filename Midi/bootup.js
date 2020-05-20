Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('../PopEngineCommon/PopMidi.js');


//	https://wiki.ccarh.org/wiki/MIDI_file_parsing_homework for testing parsing
const MidiFilename = 'Test.mid';
//const MidiFilename = 'Twinkle.mid';
const MidiContents = Pop.LoadFileAsArrayBuffer(MidiFilename);

const Midi = Pop.Midi.Parse(MidiContents);
Pop.Debug(`Midi: ${Midi}`);

function MakeMidiMapImage(Midi)
{
	const NoteNames = GetNoteNames();
	const Rows = Midi.Tracks.length * NoteNames.length;
	
	const MsPerPixel = 2;
	const Columns = Math.ceil(Midi.DurationMs / MsPerPixel);
	
	const FormatChannels = 3;
	const Pixels = new Uint8Array( Columns * Rows * FormatChannels );
	Pixels.fill(255);
	function Write(x,y,Channel)
	{
		let pi = (y*Columns) + x;
		pi *= FormatChannels;
		const ChannelColours = [ [1,0,0],[1,1,0],[0,1,0],[0,1,1],[0,0,1],[1,0,1]];
		const Rgb = ChannelColours[Channel];
		Pixels[pi+0] = Rgb[0] * 255;
		Pixels[pi+1] = Rgb[1] * 255;
		Pixels[pi+2] = Rgb[2] * 255;
	}
	
	function DrawTrack(Track,TrackIndex)
	{
		function DrawNote(Note)
		{
			const NoteIndex = NoteNames.indexOf(Note.Note);
			const y = (TrackIndex * NoteNames.length) + NoteIndex;
			const sx = Math.floor(Note.StartTimeMs/MsPerPixel);
			const ex = Math.max(sx+1, Math.floor(Note.EndTimeMs/MsPerPixel));
			Pop.Debug(`Draw Note ${Note} ${sx},${ex},${y} ${Rows},${Columns}`);
			for ( let x=sx;	x<=ex;	x++ )
				Write(x,y,Note.Channel);
		}
		Track.Notes.forEach(DrawNote);
	}
	Midi.Tracks.forEach(DrawTrack);

	const PixelImage = new Pop.Image();
	const Format = 'RGB';
	PixelImage.WritePixels( Columns, Rows, Pixels, Format );
	return PixelImage;
}


//	now make a window & draw the sequence
const Window = new Pop.Gui.Window("I love midi!");

const MidiImage = MakeMidiMapImage(Midi);
const Scale = 3;
const ImageMap = new Pop.Gui.ImageMap(Window,[0,0,MidiImage.GetWidth()*Scale,MidiImage.GetHeight()*Scale]);
ImageMap.SetImage(MidiImage);

