Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

//Pop.Include('../Common/PopShaderCache.js');

let Image = new Pop.Image("Marker01.jpg");
Image.SetFormat('Greyscale');
let MarkerMeta = Pop.Opencv.FindArucoMarkers(Image);
Pop.Debug(JSON.stringify(MarkerMeta));




