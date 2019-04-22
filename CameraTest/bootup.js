'use strict';

Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}


Pop.Include('../Common/PopEngine.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../Common/TFrameCounter.js');
//Pop.Include('CameraTest.js');



async function LeakTest()
{
	Pop.Debug("Pre Yield 10");
	await Pop.Yield(10);
	Pop.Debug("Pre Yield 2000");
	await Pop.Yield(20);
	let Debug = "hello ";
	Pop.Debug(Debug);
}

//Pop.AsyncLoop(LeakTest);
//LeakTest().catch(Pop.Debug);


//let MemCheckLoop = async function()
async function MemCheck()
{
	//try
	{
		await Pop.Yield(10);
		//await MakeProm();
		//Pop.Sleep(10);

		Pop.GarbageCollect();
		let Debug = "Memory: ";
		
		let ImageHeapSize = (Pop.GetImageHeapSize() / 1024 / 1024).toFixed(2) + "mb";
		let ImageHeapCount = Pop.GetImageHeapCount();
		Debug += " ImageHeapSize="+ImageHeapSize+" x" + ImageHeapCount;
		
		let GeneralHeapSize = (Pop.GetHeapSize() / 1024 / 1024).toFixed(2) + "mb";
		let GeneralHeapCount = Pop.GetHeapCount();
		Debug += " GeneralHeapSize="+GeneralHeapSize+" x" + GeneralHeapCount;
		
		//Debug += JSON.stringify(Pop.GetHeapObjects());
		Pop.Debug(Debug);

		let Img = new Pop.Image();
	}
	//catch(e)
	{
	//	Pop.Debug("Loop Error: " + e );
	}
}
async function MemCheckLoop()
{
	while( true )
	{
		await MemCheck();
	}
}
new Pop.AsyncLoop(MemCheck);
//MemCheckLoop();



