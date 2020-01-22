//	demo how to use some generic params and some helper UI tools
Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('../PopEngineCommon/PopMath.js');
Pop.Include('../PopEngineCommon/ParamsWindow.js');

const Params = {};
Params.BooleanOne = true;
Params.BooleanTwo = false;
Params.ZeroToOne = 0.5;
Params.Degrees = 0;
Params.WholeDegrees = 0;
Params.OneToThree = 2;
Params.BouncingNumber = 0;
//Params.TheColour = [1,1,1];
Params.TheColour = [1,1,1];
Params.TheString = 'hello';
Params.TheButton = 'Click me';

function OnParamChanged(Params,ChangedParam,Value,IsFinalValue)
{
	if (IsFinalValue)
		Pop.Debug("SaveSettings:",ChangedParam,Params[ChangedParam]);
}

//	create window
const ParamsWindow = new CreateParamsWindow(Params,OnParamChanged);
ParamsWindow.AddParam('BooleanOne');
ParamsWindow.AddParam('ZeroToOne',0,1);
ParamsWindow.AddParam('Degrees',-180,180);
ParamsWindow.AddParam('WholeDegrees',-180,180,Math.floor);
ParamsWindow.AddParam('OneToThree',1,3,Math.floor);
ParamsWindow.AddParam('BouncingNumber',-1,1);
//ParamsWindow.AddParam('TheColour','Colour');
ParamsWindow.AddParam('TheString');
//ParamsWindow.AddParam('TheButton','Button');


//	bouncing number
async function AutoChangeValue()
{
	let Bounce = 0;
	while (true)
	{
		await Pop.Yield(100);
		Params.BouncingNumber = Math.cos(Bounce);
		Bounce += 0.1;
		ParamsWindow.OnParamChanged('BouncingNumber');
	}
}
AutoChangeValue().then(Pop.Debug).catch(Pop.Debug);

//	load settings

//	create remote HTTP controller
