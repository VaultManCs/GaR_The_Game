/*:
 * @plugindesc Simple Map HUD (HP/Gold/Variable) for RPG Maker MV. v1.0
 * @author You + Copilot
 *
 * @param ShowSwitchId
 * @type switch
 * @desc If 0, HUD always shows. If >0, HUD shows only when this switch is ON.
 * @default 0
 *
 * @param VariableId
 * @type variable
 * @desc Variable ID to display on HUD (e.g., score/keys). 0 disables.
 * @default 0
 *
 * @param VariableLabel
 * @type text
 * @desc Label shown before the variable value.
 * @default Score
 *
 * @param HudX
 * @type number
 * @min 0
 * @desc HUD X position (pixels).
 * @default 12
 *
 * @param HudY
 * @type number
 * @min 0
 * @desc HUD Y position (pixels).
 * @default 12
 *
 * @param HudWidth
 * @type number
 * @min 120
 * @desc HUD window width.
 * @default 260
 *
 * @param HudHeight
 * @type number
 * @min 72
 * @desc HUD window height.
 * @default 120
 *
 * @help
 * SimpleMapHUD.js
 * - Shows a small HUD on the map.
 * - Displays: leader name, HP, gold, and optionally one variable.
 * - Use ShowSwitchId to toggle visibility via a switch.
 *
 * Notes:
 * - Designed for RPG Maker MV (not MZ).
 * - If another HUD overlaps, adjust HudX/HudY.
 */

var Imported = Imported || {};
Imported.SimpleMapHUD = true;

var SimpleMapHUD = SimpleMapHUD || {};
SimpleMapHUD.version = "1.0";

(function() {
  "use strict";

  // --- Parameters ---
  var params = PluginManager.parameters("GaR_HUD");
  var SHOW_SWITCH_ID = Number(params["ShowSwitchId"] || 0);
  var VAR_ID         = Number(params["VariableId"] || 0);
  var VAR_LABEL      = String(params["VariableLabel"] || "Score");

  var HUD_X      = Number(params["HudX"] || 12);
  var HUD_Y      = Number(params["HudY"] || 12);
  var HUD_W      = Number(params["HudWidth"] || 260);
  var HUD_H      = Number(params["HudHeight"] || 120);

  // --- HUD Window Class ---
  function Window_SimpleMapHUD() {
    this.initialize.apply(this, arguments);
  }

  Window_SimpleMapHUD.prototype = Object.create(Window_Base.prototype);
  Window_SimpleMapHUD.prototype.constructor = Window_SimpleMapHUD;

  Window_SimpleMapHUD.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.opacity = 200; // slightly transparent
    this._lastKey = "";
    this.refresh();
  };

  Window_SimpleMapHUD.prototype.update = function() {
    Window_Base.prototype.update.call(this);

    // Toggle visibility based on switch (if configured)
    if (SHOW_SWITCH_ID > 0) {
      this.visible = $gameSwitches.value(SHOW_SWITCH_ID);
    } else {
      this.visible = true;
    }

    if (!this.visible) return;

    // Only redraw when something changed (cheap optimisation)
    var actor = $gameParty.leader();
    var hp    = actor ? actor.hp : 0;
    var mhp   = actor ? actor.mhp : 0;
    var gold  = $gameParty.gold();
    var v     = (VAR_ID > 0) ? $gameVariables.value(VAR_ID) : null;

    var key = [
      actor ? actor.name() : "",
      hp, mhp, gold,
      (VAR_ID > 0 ? v : "noVar")
    ].join("|");

    if (key !== this._lastKey) {
      this._lastKey = key;
      this.refresh();
    }
  };

  Window_SimpleMapHUD.prototype.refresh = function() {
    this.contents.clear();

    var lineH = this.lineHeight();
    var x = 0;
    var y = 0;

    var actor = $gameParty.leader();
    if (!actor) {
      this.drawText("No party leader", x, y, this.contentsWidth(), "left");
      return;
    }

    // Leader Name
    this.changeTextColor(this.systemColor());
    this.drawText("Leader:", x, y, 72, "left");
    this.resetTextColor();
    this.drawText(actor.name(), x + 72, y, this.contentsWidth() - 72, "left");
    y += lineH;

    // HP (with gauge)
    this.changeTextColor(this.systemColor());
    this.drawText("HP:", x, y, 72, "left");
    this.resetTextColor();

    var gaugeX = x + 72;
    var gaugeW = this.contentsWidth() - 72;
    var rate   = actor.mhp > 0 ? actor.hp / actor.mhp : 0;

    this.drawGauge(gaugeX, y, gaugeW, rate, this.hpGaugeColor1(), this.hpGaugeColor2());
    this.drawText(actor.hp + " / " + actor.mhp, gaugeX, y, gaugeW, "center");
    y += lineH;

    // Gold
    this.changeTextColor(this.systemColor());
    this.drawText("Gold:", x, y, 72, "left");
    this.resetTextColor();
    this.drawText(String($gameParty.gold()), x + 72, y, this.contentsWidth() - 72, "left");
    y += lineH;

    // Variable (optional)
    if (VAR_ID > 0) {
      this.changeTextColor(this.systemColor());
      this.drawText(VAR_LABEL + ":", x, y, 72, "left");
      this.resetTextColor();
      this.drawText(String($gameVariables.value(VAR_ID)), x + 72, y, this.contentsWidth() - 72, "left");
      y += lineH;
    }
  };

  // --- Hook into Scene_Map ---
  // Scene_Map.createDisplayObjects is called when map is loaded (safe place to add HUD).
  // Scene_Map docs show createDisplayObjects exists and is used in the map load flow. [3](https://github.com/swquinn/rmmv-docs/blob/master/docs/Scene_Map.md)[4](https://kinoar.github.io/rmmv-doc-web/classes/scene_map.html)
  var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects.call(this);
    this.createSimpleMapHUD();
  };

  Scene_Map.prototype.createSimpleMapHUD = function() {
    // Prevent duplicates if map reloads
    if (this._simpleMapHudWindow) return;
    this._simpleMapHudWindow = new Window_SimpleMapHUD(HUD_X, HUD_Y, HUD_W, HUD_H);

    // addWindow puts it on the window layer (common HUD/window approach). [5](https://forums.rpgmakerweb.com/index.php?threads/displaying-a-window-while-the-game-is-active.142630/)
    this.addWindow(this._simpleMapHudWindow);
  };

})();