
async function ClientTest(Hostname,Port=80)
{
	Pop.Debug(`Creating websocket client`);
	const Socket = new Pop.Websocket.Client(Hostname,Port);
	Pop.Debug(`Waiting to connect`);
	await Socket.WaitForConnect();
	Pop.Debug(`Connected`);
	Pop.Debug(JSON.stringify(Socket.GetAddress()));
	const Token = '<Hello>';
	Pop.Debug(`Getpeers=${JSON.stringify(Socket.GetPeers())}`);
	const Peer = Socket.GetPeers()[0];
	Socket.Send( Peer, Token );
	const Message = await Socket.WaitForMessage();
	Pop.Debug(`Reply: ${JSON.stringify(Message)} (sent ${Token})`);
}

async function ServerTest(Port=80)
{
	const Socket = new Pop.Websocket.Server(Port);
	Pop.Debug(`Server listening on ${JSON.stringify(Socket.GetAddress())}`);

	function SendToPeers(Message,ExcludePeer)
	{
		const Peers = Socket.GetPeers().filter(p => p != ExcludePeer);
		Peers.forEach(p => Socket.Send(p,Message));
	}

	//	run a thread that waits for messages from anyone
	async function MessageThread()
	{
		while (true)
		{
			//	wait for a message (or disconnection)
			//	and relay it to any other peers
			const Packet = await Socket.WaitForMessage();
			SendToPeers(Packet.Data,Packet.Peer);
		}
	}

	//	don't currently have a promise/func for "Wait for a client to connect"
	async function PingThread()
	{
		while (true)
		{
			await Pop.Yield(1000);
			const Message = `Ping ${Pop.GetTimeNowMs()}`;
			Pop.Debug(`Peers; ${Socket.GetPeers()}`);
			SendToPeers(Message);
		}
	}

	const PingThreadFinished = PingThread();
	const RecvThreadFinished = MessageThread();
	//	wait for a thread to exit (will throw on disconnection)
	await Promise.race([PingThreadFinished,RecvThreadFinished]);
}



const ListenPort = 1212;
ServerTest(ListenPort).catch(Pop.Warning);

const Hostname = 'echo.websocket.org';
//ClientTest(Hostname).catch(Pop.Warning);



