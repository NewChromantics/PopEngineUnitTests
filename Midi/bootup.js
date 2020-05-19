const Window = new Pop.Gui.Window("I love midi!");

const MidiControllerMessages = {};
MidiControllerMessages.BankSelect = 0;
MidiControllerMessages.ModulationWheel = 1;
MidiControllerMessages.BreathControl = 2;
MidiControllerMessages.FootController = 4;
MidiControllerMessages.PortamentoTime = 5;
MidiControllerMessages.DataEntry = 6;
MidiControllerMessages.ChannelVolume = 7;
MidiControllerMessages.Balance = 8;
MidiControllerMessages.Pan = 10;
MidiControllerMessages.ExpressionController = 11;
MidiControllerMessages.EffectControl1 = 12;
MidiControllerMessages.EffectControl2 = 13;
MidiControllerMessages.GeneralPurposeController1 = 16;
MidiControllerMessages.GeneralPurposeController2 = 17;
MidiControllerMessages.GeneralPurposeController3 = 18;
MidiControllerMessages.GeneralPurposeController4 = 19;
MidiControllerMessages.BankSelect2 = 32;
MidiControllerMessages.ModulationWheel2 = 33;
MidiControllerMessages.BreathControl2 = 34;
MidiControllerMessages.FootController2 = 36;
MidiControllerMessages.PortamentoTime2 = 37;
MidiControllerMessages.DataEntry2 = 38;
MidiControllerMessages.ChannelVolume2 = 39;
MidiControllerMessages.Balance2 = 40;
MidiControllerMessages.Pan2 = 42;
MidiControllerMessages.EffectControl1_2 = 44;
MidiControllerMessages.EffectControl2_2 = 45;
MidiControllerMessages.GeneralPurposeController1_2 = 48;
MidiControllerMessages.GeneralPurposeController2_2 = 49;
MidiControllerMessages.GeneralPurposeController3_2 = 50;
MidiControllerMessages.GeneralPurposeController4_2 = 51;

MidiControllerMessages.SoundController1 = 70;
MidiControllerMessages.SoundController2 = 71;
MidiControllerMessages.SoundController3 = 72;
MidiControllerMessages.SoundController4 = 73;
MidiControllerMessages.SoundController5 = 74;
MidiControllerMessages.SoundController6 = 75;
MidiControllerMessages.SoundController7 = 76;
MidiControllerMessages.SoundController8 = 77;
MidiControllerMessages.SoundController9 = 78;
MidiControllerMessages.SoundController10 = 79;

MidiControllerMessages.DataEntryPlus1 = 96;
MidiControllerMessages.DataEntryMinus1 = 97;

MidiControllerMessages.AllSoundOff = 120;
MidiControllerMessages.ResetAllControllers = 121;
MidiControllerMessages.LocalControlOnOff = 122;
MidiControllerMessages.AllNotesOff = 123;


function SliceString(Array,Start,Length)
{
	const String8 = Array.slice(Start,Start + Length);
	const StringString = String.fromCharCode(...String8);
	return StringString;
}

function Slice32(Array,Start)
{
	const Size8 = Array.slice(Start,Start + 4);
	const Size8a = new Uint8Array(Size8.reverse());
	const Size32 = new Uint32Array(Size8a.buffer)[0];
	return Size32;
}

function Slice16(Array,Start)
{
	const Size8 = Array.slice(Start,Start + 2);
	const Size8a = new Uint8Array(Size8.reverse());
	const Size16 = new Uint16Array(Size8a.buffer)[0];
	return Size16;
}

Pop.Midi = {};
Pop.Midi.Parse = function (FileContents)
{
	const Midi = {};
	Midi.TimeToMs = null;
	Midi.Tracks = null;
	Midi.Format = null;

	function Parse_MTrk(Data)
	{
		//	add to next undefined track
		const NextTrack = Midi.Tracks.indexOf(null);
		Midi.Tracks[NextTrack] = Data;
		//Pop.Debug(`NextTrack = ${NextTrack}`);

		let DataPosition = 0;
		function Peek8(Count=1)
		{
			const Extra = Count - 1;
			if (DataPosition + Extra == Data.length)
				return null;
			if (DataPosition + Extra > Data.length)
				throw RangeError("Track Data OOB")
			const Value = (Extra == 0) ? Data[DataPosition] : Data.slice(DataPosition,DataPosition + Count);
			return Value;
		}

		function Pop8()
		{
			const Value = Peek8();
			DataPosition++;
			return Value;
		}

		function PopVariableLengthValue()
		{
			let Value = 0;
			let LoopCount = 1000;
			while (LoopCount-->0)
			{
				const v8 = Pop8();
				const Continuation = v8 & 0x80;
				const v7 = v8 & (~0x80);
				Value <<= 8;
				Value |= v7;
				if (!Continuation)
					break;
			}
			return Value;
		}

		function PopData(Length)
		{
			return Pop8(Length);
		}

		function ParseMidiEvent()
		{
			const EventControllerMessage = Pop8();
			let Message = Object.keys(MidiControllerMessages).find(k => MidiControllerMessages[k] === EventControllerMessage);

			//MidiControllerMessages.entries().filter()
			//let Message = MidiControllerMessages[EventControllerMessage];
			Message = Message ? Message + ' ' : '';
			Message += '#'+EventControllerMessage;
			
			const Event3 = Pop8();
			Pop.Debug(`Midi event: ${Message},${Event3.toString(16)}`);
		}

		function ParseSystemEvent(Event)
		{
			const Length = PopVariableLengthValue();
			Pop.Debug(`System event (${Event.toString(16)}) x${Length}`);
			const EventData = PopData(Length);
		}

		function ParseMetaEvent()
		{
			const Event2 = Pop8();
			const Length = PopVariableLengthValue();
			Pop.Debug(`Meta event #${Event2.toString(16)} x${Length}`);
			const EventData = PopData(Length);
		}

		function ParseEvent(Event)
		{
			const SystemEvent = 0xf0;
			const EscapeEvent = 0xf7;
			const MetaEvent = 0xff;
			switch (Event)
			{
				case SystemEvent:
				case EscapeEvent:
					return ParseSystemEvent(Event);
				case MetaEvent:
					return ParseMetaEvent();
				default:
					return ParseMidiEvent();
			}
		}

		//	parse the data
		let Time = 0;
		while (Peek8()!==null)
		{
			const TimeSinceLast = PopVariableLengthValue();
			const Event = Pop8();
			ParseEvent(Event);
		}

	}

	function Parse_Mthd(Data)
	{
		Midi.Format = Slice16(Data,0);
		const TrackCount = Slice16(Data,2);
		Midi.TimeToMs = Slice16(Data,4);
		Midi.Tracks = Array(TrackCount).fill(null);
		Pop.Debug(`Midi: ${JSON.stringify(Midi)}`);
	}

	function EnumAtom(Fourcc,Data)
	{
		Pop.Debug(`Atom ${Fourcc} x${Data.length}; ${Data}`);
		switch (Fourcc)
		{
			case 'MThd': return Parse_Mthd(Data);
			case 'MTrk': return Parse_MTrk(Data);
		}
		throw `Unhandled Midi Atom ${Fourcc} x${Data.length}`;
	}

	function ParseAtom(Offset)
	{
		const Atom = {};
		Atom.Fourcc = SliceString(FileContents,Offset + 0,4);
		Atom.DataSize = Slice32(FileContents,Offset + 4);
		Atom.DataOffset = 4 + 4;
		Atom.AtomSize = Atom.DataOffset + Atom.DataSize;
		return Atom;
	}

	for (let i = 0;i < FileContents.length;i += 0)
	{
		const Atom = ParseAtom(i);
		const DataStart = i + Atom.DataOffset;
		const DataEnd = DataStart + Atom.DataSize;
		if (DataEnd > FileContents.length)
			throw `Atom data ${DataStart}...${DataEnd} out of range (${FileContents.length})`;
		const AtomData = FileContents.slice(DataStart,DataEnd);
		EnumAtom( Atom.Fourcc, AtomData );
		i += Atom.AtomSize;
	}
}

const MidiFilename = 'Test.mid';
const MidiContents = Pop.LoadFileAsArrayBuffer(MidiFilename);
Pop.Midi.Parse(MidiContents);
