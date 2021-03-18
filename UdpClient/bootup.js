//	flood a udp server at X fps with a full packet ~1600 mtu with a 
//	counter prefix, to detect packet dropping on server side
async function ClientFlood(Hostname,Port,DelayMs=1,PacketSize=20*1000)
{
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
		
		const Repeats = 10;
		for ( let i=0;	i<Repeats;	i++ )
		{
			Packet[0] = PacketCounter;
			PacketCounter++;
			Client.Send(ServerPeer,Packet8);
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
