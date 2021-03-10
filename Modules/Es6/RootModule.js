import Hello from './FuncModule.js'
import MyClass from './ClassModule.js'

//	reexport
export { Hello, MyClass };


export class RootTest
{
  constructor(beep)
  {
  	this.y = Hello();
  	this.x = new MyClass();
  }
}

