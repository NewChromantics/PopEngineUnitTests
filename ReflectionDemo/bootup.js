'use strict';
//	demo of reusable reflection
//	this is basically all JS, so not really showing any benefits of the engine
//	but usable for remote UI

//	make a websocket server
//	make a webserver
//	serve a page that
//		connects to our websocket
//		has sliders for variables
//	expose variables to sliders
//	relay values in & out from websocket

function TReflectorWebsite(HttpPort=8080,WebsocketPort=9090)
{
	this.Http = new Pop.Http.Server(HttpPort);
	//this.Websocket = new Pop.Websocket.Server(WebsocketPort);

	Pop.Debug("HTTP server at " + JSON.stringify(this.Http.GetAddress()) );
	
	//	overwrite this
	this.OnVariableChanged = function(Name,Value)
	{
		Pop.Debug("TReflectorWebsite.OnVariableChanged( " + Name + ", " + Value + ")");
	}
	
	this.UpdateVariables = function(Variables)
	{
		//	make a message for websocket to parse...
		let Message = JSON.stringify( Variables );
		let Peers = this.Websocket.GetPeers();
		Peers.forEach( Peer => this.Websocket.Send( Peer, Message ) );
	}
	
	this.OnPageRequest = function(Request)
	{
		if ( Request.Url != '/' )
			throw "Unhandled page " + Request.Url;
		
		return '<html><body>Hello!</body></html>';
	}
	
	this.OnMessage = function(Message)
	{
		//	parse as new variable
		Pop.Debug( Message );
		//	OnVariableChanged()
	}
	
	this.Websocket.OnMessage = this.OnMessage.bind(this);
	this.Http.OnRequest = this.OnPageRequest.bind(this);
}

//	namespace
Pop.Reflection = {};

Pop.Reflection.TVariable = function(Name,InitialValue,MinValue,MaxValue)
{
	this.Name = Name;
	this.InitialValue = InitialValue;
	this.MinValue = MinValue;
	this.MaxValue = MaxValue;
}

function TReflectionManager(OnVariableChanged,Reflector)
{
	this.Variables = [];
	this.Reflector = Reflector;

	this.AddVariable = function(Name,InitialValue,Min,Max)
	{
		let Var = new Pop.Reflection.TVariable( Name, InitialValue, Min, Max );
		this.Variables.push( Var );
		this.Reflector.UpdateVariables( this.Variables );
	}

	//	relay change out
	this.Reflector.OnVariableChanged = OnVariableChanged;
}







let Red = 255;
let Green = 0;
let Blue = 0;

function OnVariableChanged(Name,Value)
{
	switch ( Name )
	{
		case 'Red':		Red = Value;	return;
		case 'Green':	Green = Value;	return;
		case 'Blue':	Blue = Value;	return;
	}
	throw "Unknown variable name " + Name;
}

let ReflectionUx = new TReflectorWebsite();
let ReflectionMan = new TReflectionManager( OnVariableChanged, ReflectionUx );
ReflectionMan.AddVariable( 'Red', Red, 0, 255 );
ReflectionMan.AddVariable( 'Green', Green, 0, 255 );
ReflectionMan.AddVariable( 'Blue', Blue, 0, 255 );



function OnRender(RenderTarget)
{
	RenderTarget.ClearColour( Red, Green, Blue );
}

let Window = new Pop.Opengl.Window("Arr Gee Bee");
Window.OnRender = OnRender;

