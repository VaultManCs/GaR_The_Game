/*:
 * @plugindesc Simple working Menu Button (Top Right)
 * @author GaR (fixed)
 */

var Imported = Imported || {};
Imported.GaR_MenuButton = true;

(function() {

"use strict";

// ------------------------------
// Button Window
// ------------------------------
function Window_GaRMenuButton() {
    this.initialize.apply(this, arguments);
}

Window_GaRMenuButton.prototype = Object.create(Window_Command.prototype);
Window_GaRMenuButton.prototype.constructor = Window_GaRMenuButton;

Window_GaRMenuButton.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.select(0);
    this.activate();
    this.refresh();
    this.updatePlacement();
};

Window_GaRMenuButton.prototype.windowWidth = function() {
    return 140;
};

Window_GaRMenuButton.prototype.numVisibleRows = function() {
    return 1;
};

Window_GaRMenuButton.prototype.makeCommandList = function() {
    this.addCommand("Menu", "menu");
};

Window_GaRMenuButton.prototype.updatePlacement = function() {
    this.x = Graphics.boxWidth - this.width - 12;
    this.y = 12;
};

// ------------------------------
// Scene_Map integration
// ------------------------------
var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
Scene_Map.prototype.createAllWindows = function() {
    _Scene_Map_createAllWindows.call(this);
    this.createMenuButton();
};

Scene_Map.prototype.createMenuButton = function() {
    this._menuButton = new Window_GaRMenuButton();

    // THIS is the critical missing link
    this._menuButton.setHandler("menu", this.openMenu.bind(this));

    this.addWindow(this._menuButton);
};

Scene_Map.prototype.openMenu = function() {
    SceneManager.push(Scene_Menu);
};

// ------------------------------
// Prevent map stealing clicks
// ------------------------------
var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
Scene_Map.prototype.processMapTouch = function() {
    if (this._menuButton && this._menuButton.isTouchedInsideFrame()) {
        return;
    }
    _Scene_Map_processMapTouch.call(this);
};

})();