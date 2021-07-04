import  * as	FuncModule from './Folder/FuncModule.js'
import HelloDefault from './Folder/FuncModule.js'
//import {Hello} from './Folder/FuncModule.js'

FuncModule.default();
FuncModule.Hello();
HelloDefault();

Pop.Debug(`aaa = ${FuncModule.aaa}`);
Pop.Debug(`bbb = ${FuncModule.bbb}`);
Pop.Debug(`ccc = ${FuncModule.ccc}`);
Pop.Debug(`ddd = ${FuncModule.ddd}`);
