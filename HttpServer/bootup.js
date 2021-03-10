//	this serves files straight out of the app resource directory.
//	see http://localhost:8008/bootup.js
const HttpServer = new Pop.Http.Server(8008);

//	show what addresses we're listening on (this is an array as it enumerates all interfaces on this machine)
const Addresses = HttpServer.GetAddress();
Addresses.forEach(Addr => Pop.Debug(JSON.stringify(Addr)));

//	todo: allow overload certain urls
//	todo: fetch from ourselves and make sure output is expected for unit test

const HttpClient = new Pop.Http.Client('http://lanregistry.panopo.ly/debug');
HttpClient.WaitForBody().then(Pop.Debug).catch(Pop.Warning);

