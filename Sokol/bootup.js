Pop.Debug("Hello World")

Pop.Debug(Pop.Sokol)

const Window = new Pop.Gui.Window("Sokol Test");

try
{
	const Sokol = new Pop.Sokol.RenderPipeline(Window, "GLView");
}
catch(e)
{
	Pop.Debug(e)
}
