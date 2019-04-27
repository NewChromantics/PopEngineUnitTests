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
//Pop.Include('../Common/MemCheckLoop.js');


