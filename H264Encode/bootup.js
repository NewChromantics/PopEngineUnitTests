

async function Run(Filename)
{
	const Input = new Pop.Image(Filename);
	const Encoder = new Pop.Media.H264Encoder();
	await Encoder.Encode(Input,0);

	const Decoder = new Pop.Media.AvcDecoder();
	let Output = null;

	//	encode, decode, encode, decode etc
	while ( true )
	{
		const Packet = await Encoder.GetNextPacket();
		if ( !Packet )
			break;
	
		const Frame = Decoder.PushData(Packet);
		if ( Frame )
			Output = Frame;
	}
}
Run('cat.jpeg').then(Pop.Debug).catch(Pop.Debug);

