//	todo: create a png (for extra points, to memory instead of file)
//		load & match meta we created it with

const AllFilenames = Pop.GetFilenames();
const PngFilenames = AllFilenames.filter( Filename => Filename.endsWith('.png') );
Pop.Debug("PngFilenames",PngFilenames);

function ShowMeta(Filename)
{
	let Image = new Pop.Image(Filename);
	if ( !Image.Meta )
		throw Filename + " has no meta";
	
	Pop.Debug( JSON.stringify(Image.Meta) );
}

PngFilenames.forEach( ShowMeta );

