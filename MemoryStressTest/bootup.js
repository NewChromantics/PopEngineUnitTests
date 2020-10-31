//	this test is to ensure/measure JS garbage collection happens

//	keep allocating big images. Memory should exhaust.
//	but as we just allocate images on the stack and not 
//	globally or bound to anything, they should garbage collect 
//	without promopting (or forcing, which we cannot force on ios store anyway)
let LastImage = null;
const ImageStore = [];

async function ImageAllocThread()
{
	let ImageCounter = 0;
	while(true)
	{
		await Pop.Yield(10);
		const w = 2048;
		const h = w;
		const Format = 'RGBA';	
		const Channels=4;
		const Pixels = new Uint8Array(w*h*Channels);
		const NewImage = new Pop.Image(`Image number ${ImageCounter}`);
		NewImage.WritePixels( w, h, Pixels, Format );
		ImageCounter++;
		
		//	get engine stats which should track images still allocated
		const Stats = {};
		Stats.ImageHeapSize = Pop.GetImageHeapSize() / 1024 + 'kb';
		Stats.GetImageHeapCount = Pop.GetImageHeapCount();
		Stats.GetHeapSize = Pop.GetHeapSize() / 1024 + 'kb';
		Stats.GetHeapCount = Pop.GetHeapCount();
		//Stats.GetHeapObjects = Pop.GetHeapObjects();
		Stats.ImageHeapSize = Pop.GetImageHeapSize() / 1024 + 'kb';
		Stats.GetCrtHeapSize = Pop.GetCrtHeapSize();
		Stats.GetCrtHeapCount = Pop.GetCrtHeapCount();
		Stats.JavascriptImageCounter = ImageCounter;
		
		//if ( ImageCounter % 100 == 0 )
			Pop.Debug(JSON.stringify(Stats));
		
		ImageStore.push(NewImage);
		LastImage = NewImage;
		
		//	not needed, should cleanup from stack
		//NewImage = null;
	}
}

async function OtherThread()
{
	while(true)
	{
		//	every second, dump all images
		await Pop.Yield(1000);
		Pop.Debug(`Dumping ${ImageStore.length} images`);
		ImageStore.splice(0,ImageStore.length);
		LastImage = null;
	}
}
	

ImageAllocThread().catch(Pop.Warning);	//	gr: uncaught throw isn't ever reported!
OtherThread().catch(Pop.Warning);	//	gr: uncaught throw isn't ever reported!
