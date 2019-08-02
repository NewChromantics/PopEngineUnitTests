Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}


Pop.Include('../PopEngineCommon/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');

Pop.Include('../PopEngineCommon/PopMedia.js');
Pop.Include('../PopEngineCommon/PopTexture.js');
Pop.Include('VideoTest.js');


