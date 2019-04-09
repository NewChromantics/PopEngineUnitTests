Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('../Common/PopEngine.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../Common/TFrameCounter.js');
Pop.Include('CameraTest.js');
