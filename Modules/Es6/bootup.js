import {Hello,RootTest} from './RootModule.js'

Hello();
const rt = new RootTest();

async function AsyncFunction()
{
	await true;
	Pop.Debug("Bootup.js finished");
}

AsyncFunction();
