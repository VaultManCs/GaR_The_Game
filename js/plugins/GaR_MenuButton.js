/*:
 * @plugindesc Adds a configurable top-right Menu button on the map (RPG Maker MV). v1.2
 * @author GaR
 *
 * @param EnabledSwitchId
 * @type switch
 * @desc If 0: always visible. If >0: visible only when this switch is ON.
 * @default 0
 *
 * @param XOffset
 * @type number
 * @min 0
 * @desc Distance from the right edge (pixels).
 * @default 12
 *
 * @param YOffset
 * @type number
 * @min 0
 * @desc Distance from the top edge (pixels).
 * @default 12
 *
 * @param ButtonWidth
 * @type number
 * @min 72
 * @desc Button window width.
 * @default 140
 *
 * @param ButtonHeight
 * @type number
 * @min 36
 * @desc Button window height.
 * @default 48
 *
 * @param Label
 * @type text
 * @desc Text shown on the button.
 * @default Menu
 *
 * @param Align
 * @type select
 * @option left
 * @option center
 * @option right
 * @desc Text alignment inside the button.
 * @default center
 *
 * @param Opacity
 * @type number
 * @min 0
 * @max 255
 * @desc Frame opacity (0 = invisible frame).
 * @default 0
 *
 * @param BackOpacity
 * @type number
 * @min 0
 * @max 255
 * @desc Background opacity.
 * @default 160
 *
 * @param HideWhenMessageBusy
 * @type boolean
 * @desc If true, hides button while a message is showing.
 * @default true
 *
 * @param DisableWhenEventRunning
 * @type boolean
 * @desc If true, disables button while a map event is running.
 * @default true
 *
 * @help
 * GaR_MenuButton.js
 * - Adds a single Menu button in the top-right of Scene_Map.
 * - Click / Tap / OK opens the default menu.
 */

var Imported = Imported || {};
Imported.GaR_MenuButton = true;

(function() {
  "use strict";

  // MV reads params by plugin name. [2](https://forums.rpgmakerweb.com/index.php?threads/smart-map-buttons-customizable-map-scene-interface.56986/)
  var params = PluginManager.parameters("GaR_MenuButton");

  var ENABLED_SWITCH_ID      = Number(params["EnabledSwitchId"] || 0);
  var X_OFFSET               = Number(params["XOffset"] || 12);
  var Y_OFFSET               = Number(params["YOffset"] || 12);
  var BTN_W                  = Number(params["ButtonWidth"] || 140);
  var BTN_H                  = Number(params["ButtonHeight"] || 48);
  var LABEL                  = String(params["Label"] || "Menu");
  var ALIGN                  = String(params["Align"] || "center");
  var OPACITY                = Number(params["Opacity"] || 0);
  var BACK_OPACITY           = Number(params["BackOpacity"] || 160);
  var HIDE_WHEN_MESSAGE_BUSY = String(params["HideWhenMessageBusy"] || "true") === "true";
  var DISABLE_WHEN_EVENT_RUN = String(params["DisableWhenEventRunning"] || "true") === "true";

  // ------------------------------------------------------------
  // Window_GaRMenuButton
  // ------------------------------------------------------------
  function Window_GaRMenuButton() {
    this.initialize.apply(this, arguments);
  }

  Window_GaRMenuButton.prototype = Object.create(Window_Command.prototype);
  Window_GaRMenuButton.prototype.constructor = Window_GaRMenuButton;

  Window_GaRMenuButton.prototype.initialize = function() {
    this._openMenuEnabled = true; // stored separately so refresh doesn't wipe it
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.opacity = OPACITY;
    this.backOpacity = BACK_OPACITY;
    this.updatePlacement();
    this.select(0);
    this.activate();
  };

  // IMPORTANT: Let MV size the window via these (don’t set width/height after init)
  Window_GaRMenuButton.prototype.windowWidth = function() {
    return BTN_W;
  };

  // Window_Command normally uses fittingHeight(); we want an exact button height.
  Window_GaRMenuButton.prototype.windowHeight = function() {
    return BTN_H;
  };

  Window_GaRMenuButton.prototype.numVisibleRows = function() {
    return 1;
  };

  Window_GaRMenuButton.prototype.makeCommandList = function() {
    // Enabled flag is stored on _list entries; MV checks it via isCommandEnabled. [1](https://github.com/swquinn/rmmv-docs/blob/master/docs/Scene_Map.md)
    this.addCommand(LABEL, "openMenu", this._openMenuEnabled);
  };

  Window_GaRMenuButton.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);
    this.resetTextColor();
    this.changePaintOpacity(this.isCommandEnabled(index));
    this.drawText(this.commandName(index), rect.x, rect.y, rect.width, ALIGN);
    this.changePaintOpacity(true);
  };

  Window_GaRMenuButton.prototype.updatePlacement = function() {
    this.x = Graphics.boxWidth - this.width - X_OFFSET;
    this.y = Y_OFFSET;
  };

  Window_GaRMenuButton.prototype.setCommandEnabled = function(symbol, enabled) {
    enabled = !!enabled;
    if (symbol === "openMenu" && this._openMenuEnabled !== enabled) {
      this._openMenuEnabled = enabled;
      this.refresh();       // rebuild list using makeCommandList() with correct enabled state
      this.select(0);
    }
  };

  // ------------------------------------------------------------
  // Scene_Map hooks
  // ------------------------------------------------------------

  // Create the button during map display object setup (standard place for map UI). [3](https://onedrive.live.com/?id=ba0cb961-d9e6-46d5-8a91-f97c99199164&cid=82b98afb5a2973ef&web=1)[4](https://onedrive.live.com/?id=529187f0-1b16-4426-9b60-fb625e9b2ab8&cid=82b98afb5a2973ef&web=1)
  var _Scene_Map_createDisplayObjects_GaR = Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects_GaR.call(this);
    this.createGaRMenuButton();
  };

  Scene_Map.prototype.createGaRMenuButton = function() {
    if (this._gaRMenuButton) return;

    this._gaRMenuButton = new Window_GaRMenuButton();
    this._gaRMenuButton.setHandler("openMenu", this.commandGaROpenMenu.bind(this));
    this.addWindow(this._gaRMenuButton);
  };

  Scene_Map.prototype.commandGaROpenMenu = function() {
    SceneManager.push(Scene_Menu);
  };

  // Stop map-touch movement when the press is on our button (so taps register reliably)
  var _Scene_Map_processMapTouch_GaR = Scene_Map.prototype.processMapTouch;
  Scene_Map.prototype.processMapTouch = function() {
    var btn = this._gaRMenuButton;
    if (btn && btn.visible && btn.isOpen() && btn.isTouchedInsideFrame && btn.isTouchedInsideFrame()) {
      return; // swallow the touch so the map doesn't steal it
    }
    _Scene_Map_processMapTouch_GaR.call(this);
  };

  var _Scene_Map_update_GaR = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update_GaR.call(this);

    var btn = this._gaRMenuButton;
    if (!btn) return;

    // Keep it anchored top-right if resolution changes
    btn.updatePlacement();

    // Visibility via switch
    btn.visible = (ENABLED_SWITCH_ID > 0) ? $gameSwitches.value(ENABLED_SWITCH_ID) : true;
    if (!btn.visible) return;

    // Hide during messages (optional)
    if (HIDE_WHEN_MESSAGE_BUSY && $gameMessage.isBusy()) {
      btn.visible = false;
      return;
    }

    // Enable/disable during event running (optional)
    if (DISABLE_WHEN_EVENT_RUN) {
      btn.setCommandEnabled("openMenu", !$gameMap.isEventRunning());
    } else {
      btn.setCommandEnabled("openMenu", true);
    }

    // Ensure it stays interactive
    btn.activate();
  };

})();