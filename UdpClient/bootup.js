class FrameCounter
{
	constructor(CounterName="",LapTimeMs=1000)
	{
		this.CounterName = CounterName;
		this.LapTimeMs = LapTimeMs;
		this.LastLapTime = null;
		this.Count = 0;
		
		//	this can be overloaded, so is a member
		this.Report = this.ReportDefault.bind(this);
	}
	
	ReportDefault(CountPerSec)
	{
		Pop.Debug( this.CounterName + " " + CountPerSec.toFixed(2) + "/sec");
	}

	OnLap()
	{
		let TimeElapsed = Pop.GetTimeNowMs() - this.LastLapTime;
		let Scalar = TimeElapsed / this.LapTimeMs;
		let CountPerSec = this.Count / Scalar;
		this.Report( CountPerSec );
		this.LastLapTime = Pop.GetTimeNowMs();
		this.Count = 0;
	}
	
	Add(Increment=1)
	{
		this.Count += Increment;
		
		if ( this.LastLapTime === null )
			this.LastLapTime = Pop.GetTimeNowMs();
		
		let TimeElapsed = Pop.GetTimeNowMs() - this.LastLapTime;
		if ( TimeElapsed > this.LapTimeMs )
		{
			this.OnLap();
		}
	}
}


//	flood a udp server at X fps with a full packet ~1600 mtu with a 
//	counter prefix, to detect packet dropping on server side
async function ClientFlood(Hostname,Port,DelayMs=2,PacketSize=10*1000)
{
	const MbpsCounter = new FrameCounter('mb');
	const PacketSentCounter = new FrameCounter('Packets(estimate)');
	Pop.Debug(`UDP client connecting to ${Hostname}:${Port}...`);
	const Client = new Pop.Socket.UdpClient(Hostname,Port);
	await Client.WaitForConnect();
	const ServerPeer = Client.GetPeers()[0];
	
	//	premake a packet (aligned to 32bit)
	const PacketLength = Math.floor(PacketSize / (32/8));
	const Packet = new Uint32Array(PacketLength);
	for ( let i=0;	i<Packet.length;	i++ )
	{
		const v = 0x12abcdef;
		Packet[i] = v;
	}
	
	let PacketCounter = 0;
	while (Client)
	{
		await Pop.Yield(DelayMs);
		
		//	update packet
		Packet[0] = PacketCounter;
		PacketCounter++;
		
		//	send
		const Packet8 = new Uint8Array(Packet.buffer);
		
		Client.Send(ServerPeer,Packet8);
		MbpsCounter.Add(Packet8.length/1024/1024);
		PacketSentCounter.Add( Math.max(1,Math.floor(Packet8.length/1033)) );
		
		const Repeats = 10;
		for ( let i=0;	i<Repeats;	i++ )
		{
			Packet[0] = PacketCounter;
			PacketCounter++;
			Client.Send(ServerPeer,Packet8);
			MbpsCounter.Add(Packet8.length/1024/1024);
			PacketSentCounter.Add( Math.max(1,Math.floor(Packet8.length/1033)) );
		}
		//Pop.Debug(`packet x${Packet8.length}`);
		
		if ( PacketCounter % 1000 == 0 )
			Pop.Debug(`Packet #${PacketCounter}`);
	}	
}

//const Hostname = 'localhost';
const Hostname = '192.168.8.138';//manhattan.local';
const Port = 5432;
//const Port = 54616;
ClientFlood(Hostname,Port).catch(Pop.Warning);
