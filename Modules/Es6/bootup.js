import {Hello,RootTest} from './Folder/RootModule.js'
import * as FuncModule from './Folder/FuncModule.js'

Hello();
const rt = new RootTest();

async function AsyncFunction()
{
	await true;
	Pop.Debug("Bootup.js finished");
}

AsyncFunction();
