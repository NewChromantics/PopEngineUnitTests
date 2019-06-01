

async function Run(Filename)
{
	const Input = new Pop.Image(Filename);
	const Encoder = new Pop.Media.H264Encoder('baseline');
	await Encoder.Encode(Input);

	let H264Packets = [];
	while ( true )
	{
		const Packet = await Encoder.PopPacket();
		if ( !Packet )
			break;
		H264Packets.push(Packet);
	}

	//	decode!
	let Output = null;
	const Decoder = new Pop.Media.AvcDecoder();
	for ( let i=0;	i<H264Packets.length;	i++ )
	{
		const Frame = Decoder.PushData(H264Packets[i]);
		if ( Frame )
			Output = Frame;
	}
}
Run('cat.jpeg').then(Pop.Debug).catch(Pop.Debug);

