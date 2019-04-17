Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('../Common/PopEngine.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../Common/TFrameCounter.js');
Pop.Include('CameraTest.js');



let MemCheckLoop = async function()
{
	while(true)
	{
		try
		{
			await Pop.Yield(500);
			Pop.GarbageCollect();
			let Debug = "Memory: ";
			
			let ImageHeapSize = (Pop.GetImageHeapSize() / 1024 / 1024).toFixed(2) + "mb";
			let ImageHeapCount = Pop.GetImageHeapCount();
			Debug += " ImageHeapSize="+ImageHeapSize+" x" + ImageHeapCount;
			
			let GeneralHeapSize = (Pop.GetHeapSize() / 1024 / 1024).toFixed(2) + "mb";
			let GeneralHeapCount = Pop.GetHeapCount();
			Debug += " GeneralHeapSize="+GeneralHeapSize+" x" + GeneralHeapCount;
			
			Debug += JSON.stringify(Pop.GetHeapObjects());
			Pop.Debug(Debug);
		}
		catch(e)
		{
			Debug("Loop Error: " + e );
		}
	}
}
MemCheckLoop();


