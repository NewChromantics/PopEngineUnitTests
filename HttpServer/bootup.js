import {StringToBytes} from '../PopEngineCommon/PopApi.js'

//	this serves files straight out of the app resource directory.
//	see http://localhost:8008/bootup.js
const HttpServer = new Pop.Http.Server(8008,HandleVirtualFile);

async function WriteHttpContent(Socket)
{
	for ( let i=0;	i<30;	i++ )
	{
		let RandomNumbers = new Array(10).map( x => Math.floor(Math.random()*10) );
		RandomNumbers = RandomNumbers.join('');
		RandomNumbers = StringToBytes(RandomNumbers);
		await Socket.WriteAsync(RandomNumbers);
		await Pop.Yield(1000);
	}
	await Socket.WriteAsync( StringToBytes('done!') );
}
		

function HandleVirtualFile(Response)
{
	//	redirect PopEngine files to local filename
	const Filename = Response.Url;

	if ( Filename == 'Random.txt' )
	{
		Response.Content = WriteHttpContent;
		Response.StatusCode = 200;
		return;
	}

	return Response;
}

/*
//	show what addresses we're listening on (this is an array as it enumerates all interfaces on this machine)
const Addresses = HttpServer.GetAddress();
Addresses.forEach(Addr => Pop.Debug(JSON.stringify(Addr)));

//	todo: allow overload certain urls
//	todo: fetch from ourselves and make sure output is expected for unit test

const HttpClient = new Pop.Http.Client('http://lanregistry.panopo.ly/debug');
HttpClient.WaitForBody().then(Pop.Debug).catch(Pop.Warning);

*/
