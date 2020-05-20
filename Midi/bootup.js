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
	const NoteNames = Pop.Midi.GetNoteNames();
	const Rows = Midi.Tracks.length * NoteNames.length;
	
	const MsPerPixel = 2;
	const Columns = Math.ceil(Midi.DurationMs / MsPerPixel);
	
	const FormatChannels = 3;
	const Pixels = new Uint8Array( Columns * Rows * FormatChannels );
	Pixels.fill(255);
	function Write(x,y,Channel,NoteIndex)
	{
		let pi = (y*Columns) + x;
		pi *= FormatChannels;
		const ChannelColours = [ [1,0,0],[1,1,0],[0,1,0],[0,1,1],[0,0,1],[1,0,1]];
		//const Rgb = ChannelColours[Channel];
		const Rgb = ChannelColours[NoteIndex%ChannelColours.length];
		Pixels[pi+0] = Rgb[0] * 255;
		Pixels[pi+1] = Rgb[1] * 255;
		Pixels[pi+2] = Rgb[2] * 255;
	}
	
	function DrawTrack(Track,TrackIndex)
	{
		function DrawNote(Note,DrawNoteIndex)
		{
			const NoteIndex = NoteNames.indexOf(Note.Note);
			const y = (TrackIndex * NoteNames.length) + NoteIndex;
			const sx = Math.floor(Note.StartTimeMs/MsPerPixel);
			const ex = Math.max(sx+1, Math.floor(Note.EndTimeMs/MsPerPixel));
			Pop.Debug(`Draw Note ${Note} ${sx},${ex},${y} ${Rows},${Columns}`);
			for ( let x=sx;	x<=ex;	x++ )
				Write(x,y,Note.Channel,DrawNoteIndex);
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

//	returns array of [Note]=sound
async function LoadSounds()
{
	async function LoadSoundFile(Note)
	{
		const Filename = `${Note}.wav`;
		Pop.Debug(`Filename ${Filename}`);
		const SoundData = await Pop.LoadFileAsArrayBufferAsync(Filename);
		Pop.Debug(`Got sound data! `);
		//const SoundData = null;
		return SoundData;
	}

	//	load a file for all notes, then make sounds
	const Notes = Pop.Midi.GetNoteNames();
	const Sounds = {};
	for ( const Note of Notes )
	{
		try
		{
			const SoundData = await LoadSoundFile(Note);
			const Sound = new Pop.Audio.Sound(SoundData);
			Sounds[Note] = Sound;
		}
		catch(e)
		{
			//	assume file not found
			Pop.Debug(`Error loading note ${Note} ${e}`);
			Sounds[Note] = null;
		}
	}
	
	return Sounds;
}

async function PlayMidiLoop(Midi)
{
	const Sounds = await LoadSounds();
	const StartTime = Pop.GetTimeNowMs();
	function GetTimeMs()
	{
		return Pop.GetTimeNowMs() - StartTime;
	}

	let LastTime = GetTimeMs();
	while(true)
	{
		await Pop.Yield(1);
		const Time = GetTimeMs() % Midi.DurationMs;
		//Pop.Debug(`Play time ${Time}`);
		
		function InTime(Note,Time)
		{
			const End = (Note.EndTimeMs===null) ? Note.StartTimeMs+1 : Note.EndTimeMs;
			if ( Time < Note.StartTimeMs )
				return false;
			if ( Time > End )
				return false;
			return true;
		}
		
		function BeforeTime(Note,Time)
		{
			const End = (Note.EndTimeMs===null) ? Note.StartTimeMs+1 : Note.EndTimeMs;
			if ( Time < Note.StartTimeMs )
				return true;
			return true;
		}
		
		
		function UpdateTrack(Track)
		{
			function PlayNote(Note)
			{
				const WasBefore = LastTime < Note.StartTimeMs;
				const NowDuringOrAfter = Time >= Note.StartTimeMs;
				

				if ( WasBefore && NowDuringOrAfter )
				{
					//	should start!
					const Sound = Sounds[Note.Note];
					Pop.Debug(`Play sound ${Note.Note}/${Sound} ${Time}>${Note.StartTimeMs}`);
					if ( Sound )
					{
						Sound.Seek(0);
						Sound.Play();
					}
				}
			}
			Track.Notes.forEach(PlayNote);
		}
		Midi.Tracks.forEach(UpdateTrack);
		
		LastTime = Time;
	}
}
PlayMidiLoop(Midi).then(Pop.Debug).catch(Pop.Debug);

