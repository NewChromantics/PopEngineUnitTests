

async function ReadFromCamera(Name)
{
	const FrameCount = 1000; 
	const Options = {};
	Options.Format = 'RGBA';
	const Device = new Pop.Media.Source(Name,Options);
	
	for ( let i=0;	i<FrameCount;	i++ )
	{
		const NewFrame = await Device.WaitForNextFrame();
		Pop.Debug(`Got frame ${NewFrame}(${NewFrame.PendingFrames} pending) Meta=${JSON.stringify(NewFrame.Meta)}`);
		NewFrame.Planes.forEach( Image => Image.Clear() );
	}
	
	Device.Free();
}

async function IterateCameras()
{
	let Devices = await Pop.Media.EnumDevices();
	Devices = Devices.Devices;	//	maybe remove this 
	Pop.Debug(`Got Devices: ${JSON.stringify(Devices,null,'\t')}`);
	
	for ( let i=0;	i<100;	i++ )
		await ReadFromCamera('Freenect:A22595W00862214A_Colour');
	for ( let Device of Devices )
	{
		await ReadFromCamera(Device.Serial);
	}
}

IterateCameras().then(Pop.Debug).catch(Pop.Warning);
