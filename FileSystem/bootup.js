const Devices = Pop.GetExternalDrives();
Pop.Debug(Devices);

Pop.Debug(Pop.GetTempDirectory())

const DirectoryName = "Test";
const Filename = "Test.json";

const ZipName = `Test_${Pop.GetTimeNowMs()}.zip`
const Archive = new Pop.Zip.Archive( ZipName );

let TestJSON = {hello: "World"};

let json = JSON.stringify( TestJSON );

Pop.WriteToFile( `${DirectoryName}/${Filename}`, JSON.stringify( TestJSON ) );
//await Archive.AddFile( `${DirectoryName}/${Filename}`, `${DirectoryName}/${Filename}` );

Archive.Close()