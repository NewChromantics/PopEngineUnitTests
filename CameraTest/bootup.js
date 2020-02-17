
Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

const EngineDebug = new Pop.Engine.StatsWindow();

Pop.Include('../PopEngineCommon/PopApi.js');
Pop.Include('../Common/PopShaderCache.js');
Pop.Include('../PopEngineCommon/PopFrameCounter.js');
Pop.Include('CameraTest.js');
Pop.Include('../PopEngineCommon/MemCheckLoop.js');





