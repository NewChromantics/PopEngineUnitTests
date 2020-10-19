
async function Test(Hostname,Port=80)
{
	const Socket = new Pop.Websocket.Client(Hostname,Port);
	await Socket.WaitForConnect();
	Pop.Debug(JSON.stringify(Socket.GetAddress()));
	const Token = 'Hello';
	const Peer = Socket.GetPeers()[0];
	Socket.Send( Peer, Token );
	const Message = await Socket.WaitForMessage();
	Pop.Debug(`Reply: ${Message}`);
	Socket.Close();
}
const Hostname = 'echo.websocket.org';
Test(Hostname).then(Pop.StdOut).catch(Pop.Warning);
