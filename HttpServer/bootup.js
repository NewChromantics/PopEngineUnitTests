//	this serves files straight out of the app resource directory.
//	see http://localhost:8008/bootup.js
const Http = new Pop.Http.Server(8008);

//	show what addresses we're listening on (this is an array as it enumerates all interfaces on this machine)
const Addresses = Http.GetAddress();
Addresses.forEach(Addr => Pop.Debug(JSON.stringify(Addr)));

//	todo: allow overload certain urls
//	todo: fetch from ourselves and make sure output is expected for unit test
