Pop.Debug("Hello World")

Pop.Debug(Pop.Sokol)

const Window = new Pop.Gui.Window("Sokol Test");

try
{
	const Sokol = new Pop.Sokol.Initialise(Window, "MetalView");
	Sokol.Render();
}
catch(e)
{
	Pop.Debug(e)
}
