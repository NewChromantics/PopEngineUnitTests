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
async function ServerThread(Port)
{
	const MbpsCounter = new FrameCounter('mb');
	const PacketCounter = new FrameCounter('Packets');
	Pop.Debug(`UDP server listening to ${Port}...`);
	const Socket = new Pop.Socket.UdpServer(Port);
	//await Socket.WaitForConnect();	//	nop
	
	while (Socket)
	{
		const Message = await Socket.WaitForMessage();
		
		//Pop.Debug(`Got message x${Message.Data.length} from ${Message.Peer}`);
		//Pop.Debug(`Got message x${Message.Data}`);
		//Pop.Debug(`Got message x${Message.Data.length/1024/1024}`);
		MbpsCounter.Add(Message.Data.length/1024/1024);
		PacketCounter.Add(1);
	}	
}

const Port = 5432;
ServerThread(Port).catch(Pop.Warning);
