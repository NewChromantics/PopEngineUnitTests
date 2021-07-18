import  * as	FuncModule from './Folder/FuncModule.js'
import HelloDefault from './Folder/FuncModule.js'
import {	Hello, AsyncFunc, Hello as Hello2    } from './Folder/FuncModule.js'
import BeepClass from './Folder/ClassModule.js'
import {Test_Class as ClassAsAsAsAs} from './Folder/ClassModule.js'

//	native popengine should ignore PopEngine.js, which is where we return a module on web.
//	todo: split into PopEngine seperate modules
import Pop from './PopEngine.js'
//import Pop from './FakeDir/PopEngine.js'

FuncModule.default();
FuncModule.Hello();
HelloDefault();
Hello();
AsyncFunc().catch(Pop.Debug);
Hello2();

const BeepInstance = new BeepClass();
BeepInstance.Beep();

Pop.Debug(`aaa = ${FuncModule.aaa}`);
Pop.Debug(`bbb = ${FuncModule.bbb}`);
Pop.Debug(`ccc = ${FuncModule.ccc}`);
Pop.Debug(`ddd = ${FuncModule.ddd}`);

//	allow web support of bootup.js by having a default export
//	todo: support this
//export default 'WebSupport';
const Default = 'Web Support (bootup as module)';
export default Default;
