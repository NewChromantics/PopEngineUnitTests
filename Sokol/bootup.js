Pop.Debug("Hello World")

Pop.Debug(Pop.Sokol)
const x = new Pop.Sokol.Sokol();

// const window = new Pop.Gui.Window('XibName');
// const RenderView = new Pop.Gui.RenderView('NameOfViewInXib');
// const Render= new Pop.Sokol.Test(RenderView);

try
{
	 x.Test()
}
catch(e)
{
	Pop.Debug(e)
}
