
async function Test(Hostname,Port=80)
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
const Hostname = 'echo.websocket.org';
Test(Hostname).then(Pop.StdOut).catch(Pop.Warning);
