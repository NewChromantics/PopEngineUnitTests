
Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

//Pop.Include('../PopEngineCommon/PopEngine.js');
Pop.Include('../PopEngineCommon/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');
Pop.Include('CameraTest.js');
Pop.Include('../PopEngineCommon/MemCheckLoop.js');





