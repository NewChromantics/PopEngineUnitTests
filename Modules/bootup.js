import  * as	FuncModule from './Folder/FuncModule.js'
import HelloDefault from './Folder/FuncModule.js'
import {	Hello, AsyncFunc, Hello as Hello2    } from './Folder/FuncModule.js'
import BeepClass from './Folder/ClassModule.js'
import {Test_Class as ClassAsAsAsAs} from './Folder/ClassModule.js'

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
