
let Window;

function Range(Min,Max,Value)
{
	return (Value-Min) / (Max-Min);
}

function HueToColour(Hue,Alpha=1)
{
	if ( Hue === null )
		return [0,0,0,Alpha];
	
	let Normal = Hue;
	//	same as NormalToRedGreenBluePurple
	if ( Normal < 1/6 )
	{
		//	red to yellow
		Normal = Range( 0/6, 1/6, Normal );
		return [1, Normal, 0, Alpha];
	}
	else if ( Normal < 2/6 )
	{
		//	yellow to green
		Normal = Range( 1/6, 2/6, Normal );
		return [1-Normal, 1, 0, Alpha];
	}
	else if ( Normal < 3/6 )
	{
		//	green to cyan
		Normal = Range( 2/6, 3/6, Normal );
		return [0, 1, Normal, Alpha];
	}
	else if ( Normal < 4/6 )
	{
		//	cyan to blue
		Normal = Range( 3/6, 4/6, Normal );
		return [0, 1-Normal, 1, Alpha];
	}
	else if ( Normal < 5/6 )
	{
		//	blue to pink
		Normal = Range( 4/6, 5/6, Normal );
		return [Normal, 0, 1, Alpha];
	}
	else //if ( Normal < 5/6 )
	{
		//	pink to red
		Normal = Range( 5/6, 6/6, Normal );
		return [1, 0, 1-Normal, Alpha];
	}
}

async function WindowTest()
{
	let ImageUV = new Pop.Image(2,2,'ChromaUV_88');
    while(!Window)
    {
        try
        {
            //const Rect = [0,0,640,480];
            const Rect = undefined;
            Window = new Pop.Gui.Window("Pop Engine", Rect);
            Pop.Debug(`Created window`);
            let RenderView = new Pop.Gui.RenderView(Window,"Code currently requires a name");
            Pop.Debug(`Created RenderView ${RenderView}`);
            Pop.Debug(`Pop.Sokol = ${Pop.Sokol}`);
            Pop.Debug(`Pop.Sokol.Context = ${Pop.Sokol.Context}`);
            let RenderContext = new Pop.Sokol.Context(RenderView);
            Pop.Debug(`Created RenderContext`);

            let Time = 0;
            for ( let i=0;  i<1000;    i++ )
            {
                const RenderCommands = [];
                Time += 1/60;
                const ClearColour = HueToColour( Time - Math.trunc(Time) );
                RenderCommands.push([['SetRenderTarget'],null,ClearColour]);
                await RenderContext.Render(RenderCommands);
            }

        }
        catch(e)
        {
            Pop.Warning(`render error ${e}`);
            await Pop.Yield(3000);
        }
    }
    Pop.Debug(`Got window!`);
}
WindowTest().then( ()=>Pop.ExitApplication(123));
