/*:
 * @plugindesc (MV) Duplicates Scene_Battle into a separate Scene_BattleCopy and optionally routes encounters to it. v1.0
 * @author You
 *
 * @help
 * This plugin creates an exact copy of Scene_Battle (including modifications made
 * by plugins loaded ABOVE this one) into a new scene class: Scene_BattleCopy.
 *
 * If UseBattleCopy is ON, random encounters will push Scene_BattleCopy instead of
 * Scene_Battle. The original Scene_Battle remains unchanged and unused.
 *
 * IMPORTANT:
 * - Place this plugin BELOW battle/UI plugins so the copy includes their changes.
 * - Edit Scene_BattleCopy methods in this plugin (near the bottom) to customise.
 *
 * @param UseBattleCopy
 * @type boolean
 * @on Use copied battle scene
 * @off Use default Scene_Battle
 * @default true
 */


(function() {
  "use strict";

  var PLUGIN_NAME = "CS_DuplicateBattleScene";
  var P = PluginManager.parameters(PLUGIN_NAME);
  var useCopy = String(P.UseBattleCopy).toLowerCase() === "true";

  //-----------------------------------------------------------------------------
  // Scene_BattleCopy (fresh class)
  //
  function Scene_BattleCopy() {
    this.initialize.apply(this, arguments);
  }

  // IMPORTANT:
  // We will COPY all methods/properties from Scene_Battle.prototype onto
  // Scene_BattleCopy.prototype so edits to Scene_BattleCopy don't touch Scene_Battle.
  //
  Scene_BattleCopy.prototype = Object.create(Scene_Battle.prototype);
  Scene_BattleCopy.prototype.constructor = Scene_BattleCopy;

  // Deep-clone all own properties from Scene_Battle.prototype
  // (keeps getters/setters/flags if any).
  (function clonePrototype() {
    var src = Scene_Battle.prototype;
    var dst = Scene_BattleCopy.prototype;

    Object.getOwnPropertyNames(src).forEach(function(name) {
      if (name === "constructor") return;
      var desc = Object.getOwnPropertyDescriptor(src, name);
      Object.defineProperty(dst, name, desc);
    });
  })();

  // Expose globally (useful for debugging / compatibility)
  window.Scene_BattleCopy = Scene_BattleCopy;


//-----------------------------------------------------------------------------
  // Route random encounters to Scene_BattleCopy instead of Scene_Battle
  //
  // In core MV, encounters push Scene_Battle here:
  // Scene_Map.prototype.updateEncounter = function() { if ($gamePlayer.executeEncounter()) { SceneManager.push(Scene_Battle); } }
  // [1](https://onedrive.live.com/?id=39acd3e9-a97a-495b-8d00-6dda552855d1&cid=82b98afb5a2973ef&web=1)
  //
  var _Scene_Map_updateEncounter = Scene_Map.prototype.updateEncounter;
  Scene_Map.prototype.updateEncounter = function() {
    if ($gamePlayer.executeEncounter()) {
      if (useCopy) {
        SceneManager.push(Scene_BattleCopy);
      } else {
        SceneManager.push(Scene_Battle);
      }
    }
  };

  //-----------------------------------------------------------------------------
  // OPTIONAL: a clearly-marked place to customise the COPY only.
  //
  // Example: change what windows are created, move them, add new sprites, etc.
  // Anything you change here affects ONLY Scene_BattleCopy.
  //
  // Uncomment and edit if you want:
  //
  // Scene_BattleCopy.prototype.createAllWindows = function() {
  //   // Start from the copied method if you want, then customise:
  //   Scene_Battle.prototype.createAllWindows.call(this);
  //   // your modifications...
  // };

})();