/*:
 *
 * @plugindesc Adds ability to call messages from external JSON files
 * @author TF/Tome571
 * 
 * @help
 * This plugin allows you to call messages from external JSON files.
 * Sample project is included to show you how to setup. 
 * 
 * Compatibile with Yanfly's Message core. If using MessageCore, place this
 * below MessageCore in your plugin list. 
 * 
 * -= IT IS HIGHLY RECOMMEND TO USE YANFLY MESSAGE CORE =-
 * 
 * **NOTE**
 * The external file(s) should be placed in the Data folder of your project. 
 * 
 * In the JSON folder, include an id number to call the messages from
 * Other parameters include:
 * 
 * faceset (used for picking the file)
 * faceIndex (used for picking image index from the file)
 * background (0 = normal, 1 = dim, 2 = transparent) Default is normal
 * position (0 = top, 1 = center, 2 = bottom) Default is bottom.
 * 
 * Use the script call - 
 * 
 * $gameMessage.showExternalMessage($file,id) 
 * 
 * to call the messages. You must include "$" before the filename.
 * 
 * If you want to make it easier to copy/paste your script calls, 
 * make a variable for the id, then update the variable in your events!
 
 * In the example, I use = 
 *
 * $gameMessage.showExternalMessage($exampleText,$gameVariables.value(1))
 *
 * Then the id is the value of variable 1. Change it to generate new messages!
 * 
 * You could then randomize interactions with a set of possible responses or make
 * your conversations easier to implement by adding +1 for each time an actor 
 * changes. 
 * 
 * Check out the guy on the left to see how this works. 
 * 
 * For more examples and JSON template, see the included project!
 * 
 * 
 * @param File List
 * @desc List of file names to load separated by a space
 * Default = exampleText
 * @default exampleText
 * 
 */

var Imported = Imported || {};
var TF = TF || {};
Imported.TFExternalText = true;
var TFExternalText = TFExternalText || {};

var fileList = [];
var parameters = PluginManager.parameters("TFExternalText");
var fileList = (parameters['File List'].split(' '));
for (var i = 0; i < this.fileList.length; i++) {
    var name = this.fileList[i];;
    DataManager._databaseFiles.push({name: "$"+name, src: name+".json"});
}

Game_Message.prototype.showExternalMessage = function (file,id) {
     var data = file[id];
     var faceset = data.faceset || "";
     var faceIndex = data.faceIndex || 0;
     var background = data.background || 0;
     var positionType = data.position === undefined ? 2 : data.position;
     this.setFaceImage(faceset, faceIndex);
     this.setBackground(background);
     this.setPositionType(positionType);
// Pick text
var textToShow = data.text || "";

// If textByActor exists, choose based on who is in the party
if (data.textByActor) {
    textToShow = data.defaultText || textToShow;

    // Find the first actor in the party that has a matching entry
    var members = $gameParty ? $gameParty.members() : [];
    for (var i = 0; i < members.length; i++) {
        var actorId = members[i].actorId();
        var key = String(actorId); // JSON keys are strings
        if (data.textByActor[key]) {
            textToShow = data.textByActor[key];
            break;
        }
    }
}

if (Imported && Imported.YEP_MessageCore) {
    this.addText(textToShow);
} else {
    this.add(textToShow);
}


    };