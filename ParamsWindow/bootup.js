//	demo how to use some generic params and some helper UI tools
Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('PopEngineCommon/ParamsWindow.js');

const Params = {};
Params.BooleanOne = true;
Params.ZeroToOne = 0.5;
Params.Degrees = 0;
Params.WholeDegrees = 0;

function OnParamChanged(Params,ChangedParam)
{
}

//	create window
const ParamsWindow = new ParamsWindow(Params,OnParamChanged);
ParamsWindow.AddParam('BooleanOne');
ParamsWindow.AddParam('ZeroToOne',0,1);
ParamsWindow.AddParam('Degrees',-180,180);
ParamsWindow.AddParam('WholeDegrees',-180,180,Math.floor);

//	load settings

//	create remote HTTP controller
