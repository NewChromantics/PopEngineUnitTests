Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}


let Debug = Pop.Debug;

Pop.Include('../Common/PopEngine.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../Common/TFrameCounter.js');
//	include fake being a browser for mp4.js until we rewrite it
Pop.Include('PopBrowser.js');
Pop.Include('mp4.js');
Pop.Include('Video.js');
Pop.Include('VideoTest.js');





let MemCheckLoop = async function()
{
	while(true)
	{
		try
		{
			await Pop.Yield(1000);
			//Pop.GarbageCollect();
			let ImageHeapSize = (Pop.GetImageHeapSize() / 1024 / 1024).toFixed(2) + "mb";
			let ImageHeapCount = Pop.GetImageHeapCount();
			let GeneralHeapSize = (Pop.GetHeapSize() / 1024 / 1024).toFixed(2) + "mb";
			let GeneralHeapCount = Pop.GetHeapCount();
			Pop.Debug("Memory: ImageHeapSize="+ImageHeapSize+" x" + ImageHeapCount + " GeneralHeapSize=" + GeneralHeapSize + " x"+GeneralHeapCount);

			let GeneralHeapObjects = Pop.GetHeapObjects();
			Pop.Debug(JSON.stringify(GeneralHeapObjects));
		}
		catch(e)
		{
			Pop.Debug("Loop Error: " + e );
		}
	}
}
MemCheckLoop();
