Pop.Debug("Hello World")

Pop.Debug(Pop.Sokol)

const Window = new Pop.Gui.Window("Sokol Test");

try
{
	const Sokol = new Pop.Sokol.Sokol(Window, "MetalView")
}
catch(e)
{
	Pop.Debug(e)
}
