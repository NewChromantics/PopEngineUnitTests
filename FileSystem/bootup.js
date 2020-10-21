async function Devices()
{
	const Devices = Pop.GetExternalDrives();
	Pop.Debug(Devices);
}

async function Directories()
{
	Pop.Debug(Pop.GetTempDirectory())
}

async function Zip()
{
	const DirectoryName = "Test";
	const Filename = "Test.json";

	const ZipName = `Test.zip`
	let Archive = new Pop.Zip.Archive( ZipName );

	let TestJSON = { hello: "World" };

	let json = JSON.stringify( TestJSON );

	Pop.WriteToFile( `${DirectoryName}/${Filename}`, json );
	let FullPath = "/build/UnitTest/FileSystem/Test/Test.json";
	await Archive.AddFile( `${FullPath}`, `${FullPath}` );

	Archive.Close();
}

Zip().catch(Pop.Warning);
