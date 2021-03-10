Pop.Debug(`this=${this}`);
Pop.Debug(`this.moduleLoader=${this.moduleLoader}`);

//	webapi wrapper
Pop.Import = Pop.Import || async function(Filename)
{
	return await import(Filename);
}

async function LoadModule()
{
	Pop.Debug(`await import`);
	const Module = await Pop.Import('./Module.js');
	Pop.Debug(`Module.GetOne....`);
	const One = Module.GetOne();
	Pop.Debug(`One=${One}`);
	const TwoClass = new Module.TwoClass();
}
LoadModule().catch(Pop.Warning);

