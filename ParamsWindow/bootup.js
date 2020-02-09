//	demo how to use some generic params and some helper UI tools
Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}
Pop.Include('../PopEngineCommon/PopMath.js');
Pop.Include('../PopEngineCommon/ParamsWindow.js');

const DebugWindow = new Pop.Engine.StatsWindow();


const ParamsFilename = "SavedParams.json.txt";

const Params = {};
Params.BooleanOne = true;
Params.BooleanTwo = false;
Params.ZeroToOne = 0.5;
Params.Degrees = 0;
Params.WholeDegrees = 0;
Params.OneToThree = 2;
Params.BouncingNumber = 0;
Params.TheColour = [1,0.5,0.1];
Params.TheString = 'hello';
Params.TheButton = 'Click me';

function SaveSettings(Params)
{
	const Json = JSON.stringify(Params,null,'\t');
	Pop.WriteStringToFile(ParamsFilename,Json);
}

function OnParamChanged(Params,ChangedParam,Value,IsFinalValue)
{
	if (IsFinalValue)
	{
		//Pop.Debug("SaveSettings:",ChangedParam,Params[ChangedParam]);
		try
		{
			SaveSettings(Params);
			Pop.Debug(`Saved settings (${ChangedParam} changed)`);
		}
		catch (e)
		{
			Pop.Debug("Error saving params",e);
		}
	}
}

//	create window
const ParamsWindow = new CreateParamsWindow(Params,OnParamChanged);
ParamsWindow.AddParam('BooleanOne');
ParamsWindow.AddParam('BooleanTwo');
ParamsWindow.AddParam('ZeroToOne',0,1);
ParamsWindow.AddParam('Degrees',-180,180);
ParamsWindow.AddParam('WholeDegrees',-180,180,Math.floor);
ParamsWindow.AddParam('OneToThree',1,3,Math.floor);
ParamsWindow.AddParam('BouncingNumber',-1,1);
ParamsWindow.AddParam('TheColour','Colour');
ParamsWindow.AddParam('TheString');
ParamsWindow.AddParam('TheButton','Button');


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
function LoadSettings(Filename)
{
	const Contents = Pop.LoadFileAsString(Filename);
	//	jsondiff would be good here
	const NewParams = JSON.parse(Contents);
	Object.assign(Params,NewParams);
	ParamsWindow.OnParamsChanged();
	Pop.Debug("Loaded settings",Filename);
}
try
{
	LoadSettings(ParamsFilename);
}
catch (e)
{
	Pop.Debug("Error loading saved params",e);
}

//	create remote HTTP controller
const HttpServer = RunParamsHttpServer(Params,OnParamChanged);
Pop.Debug("Showing web page at url",HttpServer.GetUrl());
const ShowWebPage = Pop.ShowWebPage(HttpServer.GetUrl());
