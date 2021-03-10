Pop.Debug(`module this=${this}`);
Pop.Debug(`module this.exports=${this.exports}`);

//	gr: babel style output with exports.
//	https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=entry&spec=false&loose=true&code_lz=KYDwDg9gTgLgBAYwDYEMDOa4gFAG9tyIQB2aMUArgjNABQBGwwYAlAXPoQL7Y_aiRYcAGYVi1AJYk4ACWBIkEWm05wowGBSjE4ARgDcvbNiA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=false&presets=env%2Ctypescript&prettier=false&targets=&version=7.12.12&externalPlugins=
"use strict";

exports.__esModule = true;
exports.GetOne = GetOne;
exports.TwoClass = void 0;

class TwoClass {
  constructor() {}

}

exports.TwoClass = TwoClass;

function GetOne() {
  return 1;
}
