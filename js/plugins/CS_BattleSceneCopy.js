/*:
 * @plugindesc (MV) Creates a NEW battle scene that is an exact copy of Scene_Battle, and optionally routes battles to it. v1.0
 * @author You
 *
 * @help
 * This plugin creates a brand-new scene class: Scene_BattleCopy.
 * It then COPIES (clones) every method from Scene_Battle.prototype onto
 * Scene_BattleCopy.prototype, so you can edit the copy without touching the original.
 *
 * If UseBattleCopy is ON:
 * - Any SceneManager.push(Scene_Battle) will instead push Scene_BattleCopy.
 * - SceneManager.isNextScene(Scene_Battle) and isPreviousScene(Scene_Battle) will
 *   also treat Scene_BattleCopy as Scene_Battle so encounter effects/fades still work.
 *
 * IMPORTANT: Put this plugin BELOW other battle plugins if you want the copy to include
 * their changes to Scene_Battle.
 *
 * After installing, you customise ONLY the copy by overriding:
 *   Scene_BattleCopy.prototype.<methodName>
 *
 * @param UseBattleCopy
 * @type boolean
 * @on Use the copied battle scene
 * @off Use the default battle scene
 * @default true
 */


(function() {
  "use strict";

  var PLUGIN_NAME = "CS_BattleSceneCopy";
  var P = PluginManager.parameters(PLUGIN_NAME);
  var USE_COPY = String(P.UseBattleCopy).toLowerCase() === "true";

  //-----------------------------------------------------------------------------
  // Scene_BattleCopy
  // A NEW class. We do NOT inherit from Scene_Battle.prototype (so it’s independent).
  //
  function Scene_BattleCopy() {
    this.initialize.apply(this, arguments);
  }

  Scene_BattleCopy.prototype = Object.create(Scene_Base.prototype);
  Scene_BattleCopy.prototype.constructor = Scene_BattleCopy;

  // Copy all own properties (methods) from Scene_Battle.prototype to Scene_BattleCopy.prototype
  function copyPrototype(srcProto, dstProto) {
    Object.getOwnPropertyNames(srcProto).forEach(function(name) {
      if (name === "constructor") return;
      var desc = Object.getOwnPropertyDescriptor(srcProto, name);
      Object.defineProperty(dstProto, name, desc);
    });
  }

  copyPrototype(Scene_Battle.prototype, Scene_BattleCopy.prototype);

  // Expose globally (handy for debugging)
  window.Scene_BattleCopy = Scene_BattleCopy;


//-----------------------------------------------------------------------------
  // SceneManager patches
  //
  // MV triggers battles via SceneManager.push(Scene_Battle) during encounters. [1](https://www.yanfly.moe/wiki/Battle_Engine_Core_%28YEP%29)
  // MV also checks SceneManager.isNextScene(Scene_Battle) to run encounter effects. [1](https://www.yanfly.moe/wiki/Battle_Engine_Core_%28YEP%29)
  // MV checks SceneManager.isPreviousScene(Scene_Battle) for fade-in after battle. [1](https://www.yanfly.moe/wiki/Battle_Engine_Core_%28YEP%29)
  //
  // So we:
  // 1) redirect push(Scene_Battle) -> push(Scene_BattleCopy)
  // 2) treat next/previous Scene_BattleCopy as Scene_Battle for those checks

  var _SceneManager_push = SceneManager.push;
  SceneManager.push = function(sceneClass) {
    if (USE_COPY && sceneClass === Scene_Battle) {
      sceneClass = Scene_BattleCopy;
    }
    _SceneManager_push.call(this, sceneClass);
  };

  var _SceneManager_goto = SceneManager.goto;
  SceneManager.goto = function(sceneClass) {
    if (USE_COPY && sceneClass === Scene_Battle) {
      sceneClass = Scene_BattleCopy;
    }
    _SceneManager_goto.call(this, sceneClass);
  };

  var _SceneManager_isNextScene = SceneManager.isNextScene;
  SceneManager.isNextScene = function(sceneClass) {
    if (USE_COPY && sceneClass === Scene_Battle) {
      return _SceneManager_isNextScene.call(this, Scene_BattleCopy) ||
             _SceneManager_isNextScene.call(this, Scene_Battle);
    }
    return _SceneManager_isNextScene.call(this, sceneClass);
  };

  var _SceneManager_isPreviousScene = SceneManager.isPreviousScene;
  SceneManager.isPreviousScene = function(sceneClass) {
    if (USE_COPY && sceneClass === Scene_Battle) {
      return _SceneManager_isPreviousScene.call(this, Scene_BattleCopy) ||
             _SceneManager_isPreviousScene.call(this, Scene_Battle);
    }
    return _SceneManager_isPreviousScene.call(this, sceneClass);
  };

//-----------------------------------------------------------------------------
  // CUSTOMISE THE COPY ONLY (examples)
  //
  // By default, Scene_BattleCopy is identical to Scene_Battle (at plugin load time).
  // Now you can safely override methods here without touching Scene_Battle.
  //
  // Example: hide the log window (uncomment to use)
  //
  // var _copy_createLogWindow = Scene_BattleCopy.prototype.createLogWindow;
  // Scene_BattleCopy.prototype.createLogWindow = function() {
  //   _copy_createLogWindow.call(this);
  //   this._logWindow.visible = false;
  // };
  //
  // Example: change how windows are created (uncomment to use)
  //
  // var _copy_createAllWindows = Scene_BattleCopy.prototype.createAllWindows;
  // Scene_BattleCopy.prototype.createAllWindows = function() {
  //   _copy_createAllWindows.call(this);
  //   // Your changes here...
  // };

})();
