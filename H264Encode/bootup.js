

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
		//Pop.Debug("Packet",typeof Packet);
		if ( !Packet )
			continue;
		const ExtractPlanes = false;
		const Frames = await Decoder.Decode(Packet,ExtractPlanes);
		Pop.Debug(JSON.stringify(Frames));
		if ( Frames.length == 0 )
			continue;

		Pop.Debug("Frames",Frames);
		Pop.Debug(Frames.length);
		const Frame = Frames[0].Planes[0];
		if ( Frame )
		{
			Pop.Debug("Output frame",Frame.GetFormat());
			Output = Frame;
		}
		
	}
}
Run('cat.jpeg').then(Pop.Debug).catch(Pop.Debug);

