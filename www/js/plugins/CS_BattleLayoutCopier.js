/*:
 * @plugindesc (MV) Battle Layout Copier — keeps MV's default battle scene, then lets you fully customise window positions/sizes/visibility. v1.0
 * @author You
 *
 * @help
 * This plugin does NOT replace the battle system. It lets MV (and other plugins)
 * create the battle windows normally, then applies your custom layout over the top.
 *
 * Put this plugin BELOW battle system/UI plugins (e.g. Yanfly) so it wins conflicts.
 *
 * Use -1 for any numeric field to "leave as default".
 *
 * @param ---Status Window---
 * @default
 * @param StatusX
 * @parent ---Status Window---
 * @type number
 * @min -1
 * @default -1
 * @param StatusY
 * @parent ---Status Window---
 * @type number
 * @min -1
 * @default -1
 * @param StatusW
 * @parent ---Status Window---
 * @type number
 * @min -1
 * @default -1
 * @param StatusH
 * @parent ---Status Window---
 * @type number
 * @min -1
 * @default -1
 * @param StatusVisible
 * @parent ---Status Window---
 * @type boolean
 * @default true
 *
 * @param ---Party Command---
 * @default
 * @param PartyCmdX
 * @parent ---Party Command---
 * @type number
 * @min -1
 * @default -1
 * @param PartyCmdY
 * @parent ---Party Command---
 * @type number
 * @min -1
 * @default -1
 * @param PartyCmdW
 * @parent ---Party Command---
 * @type number
 * @min -1
 * @default -1
 * @param PartyCmdH
 * @parent ---Party Command---
 * @type number
 * @min -1
 * @default -1
 * @param PartyCmdVisible
 * @parent ---Party Command---
 * @type boolean
 * @default true
 *
 * @param ---Actor Command---
 * @default
 * @param ActorCmdX
 * @parent ---Actor Command---
 * @type number
 * @min -1
 * @default -1
 * @param ActorCmdY
 * @parent ---Actor Command---
 * @type number
 * @min -1
 * @default -1
 * @param ActorCmdW
 * @parent ---Actor Command---
 * @type number
 * @min -1
 * @default -1
 * @param ActorCmdH
 * @parent ---Actor Command---
 * @type number
 * @min -1
 * @default -1
 * @param ActorCmdVisible
 * @parent ---Actor Command---
 * @type boolean
 * @default true
 *
 * @param ---Help Window---
 * @default
 * @param HelpX
 * @parent ---Help Window---
 * @type number
 * @min -1
 * @default -1
 * @param HelpY
 * @parent ---Help Window---
 * @type number
 * @min -1
 * @default -1
 * @param HelpW
 * @parent ---Help Window---
 * @type number
 * @min -1
 * @default -1
 * @param HelpH
 * @parent ---Help Window---
 * @type number
 * @min -1
 * @default -1
 * @param HelpVisible
 * @parent ---Help Window---
 * @type boolean
 * @default true
 *
 * @param ---Skill Window---
 * @default
 * @param SkillX
 * @parent ---Skill Window---
 * @type number
 * @min -1
 * @default -1
 * @param SkillY
 * @parent ---Skill Window---
 * @type number
 * @min -1
 * @default -1
 * @param SkillW
 * @parent ---Skill Window---
 * @type number
 * @min -1
 * @default -1
 * @param SkillH
 * @parent ---Skill Window---
 * @type number
 * @min -1
 * @default -1
 *
 * @param ---Item Window---
 * @default
 * @param ItemX
 * @parent ---Item Window---
 * @type number
 * @min -1
 * @default -1
 * @param ItemY
 * @parent ---Item Window---
 * @type number
 * @min -1
 * @default -1
 * @param ItemW
 * @parent ---Item Window---
 * @type number
 * @min -1
 * @default -1
 * @param ItemH
 * @parent ---Item Window---
 * @type number
 * @min -1
 * @default -1
 *
 * @param ---Enemy Window---
 * @default
 * @param EnemyX
 * @parent ---Enemy Window---
 * @type number
 * @min -1
 * @default -1
 * @param EnemyY
 * @parent ---Enemy Window---
 * @type number
 * @min -1
 * @default -1
 * @param EnemyW
 * @parent ---Enemy Window---
 * @type number
 * @min -1
 * @default -1
 * @param EnemyH
 * @parent ---Enemy Window---
 * @type number
 * @min -1
 * @default -1
 *
 * @param ---Log Window---
 * @default
 * @param LogVisible
 * @parent ---Log Window---
 * @type boolean
 * @default true
 */
(function() {
  "use strict";

  var PLUGIN_NAME = "CS_BattleLayoutCopier";
  var P = PluginManager.parameters(PLUGIN_NAME);

  function n(key) {
    var v = Number(P[key]);
    return isNaN(v) ? -1 : v;
  }

  function b(key) {
    return String(P[key]).toLowerCase() === "true";
  }

  function applyMove(win, x, y, w, h) {
    if (!win) return;

    var nx = x >= 0 ? x : win.x;
    var ny = y >= 0 ? y : win.y;
    var nw = w >= 0 ? w : win.width;
    var nh = h >= 0 ? h : win.height;

    if (typeof win.move === "function") {
      win.move(nx, ny, nw, nh);
    } else {
      win.x = nx;
      win.y = ny;
      win.width = nw;
      win.height = nh;
    }

    if (typeof win.createContents === "function") win.createContents();
    if (typeof win.refresh === "function") win.refresh();
  }

  function applyVisibility(win, vis) {
    if (!win) return;
    win.visible = !!vis;

    // Some window skins are drawn via sprite containers—keep them consistent.
    if (win._windowSpriteContainer) win._windowSpriteContainer.visible = !!vis;
  }
Scene_Battle.prototype._csApplyBattleLayout = function() {
    // Status
    applyMove(this._statusWindow, n("StatusX"), n("StatusY"), n("StatusW"), n("StatusH"));
    applyVisibility(this._statusWindow, b("StatusVisible"));

    // Party Command
    applyMove(this._partyCommandWindow, n("PartyCmdX"), n("PartyCmdY"), n("PartyCmdW"), n("PartyCmdH"));
    applyVisibility(this._partyCommandWindow, b("PartyCmdVisible"));

    // Actor Command
    applyMove(this._actorCommandWindow, n("ActorCmdX"), n("ActorCmdY"), n("ActorCmdW"), n("ActorCmdH"));
    applyVisibility(this._actorCommandWindow, b("ActorCmdVisible"));

    // Help
    applyMove(this._helpWindow, n("HelpX"), n("HelpY"), n("HelpW"), n("HelpH"));
    applyVisibility(this._helpWindow, b("HelpVisible"));

    // Skill + Item selection windows
    applyMove(this._skillWindow, n("SkillX"), n("SkillY"), n("SkillW"), n("SkillH"));
    applyMove(this._itemWindow,  n("ItemX"),  n("ItemY"),  n("ItemW"),  n("ItemH"));

    // Enemy select
    applyMove(this._enemyWindow, n("EnemyX"), n("EnemyY"), n("EnemyW"), n("EnemyH"));

    // Log window visibility
    applyVisibility(this._logWindow, b("LogVisible"));
  };
// Apply right after MV creates all windows.
  var _createAllWindows = Scene_Battle.prototype.createAllWindows;
  Scene_Battle.prototype.createAllWindows = function() {
    _createAllWindows.call(this);
    this._csApplyBattleLayout();
  };

  // Re-apply after refreshes that can happen when party formation changes,
  // actor states change, etc. This helps prevent "snap back".
  var _statusRefresh = Window_BattleStatus.prototype.refresh;
  Window_BattleStatus.prototype.refresh = function() {
    _statusRefresh.call(this);

    var sc = SceneManager._scene;
    if (sc && sc instanceof Scene_Battle && typeof sc._csApplyBattleLayout === "function") {
      sc._csApplyBattleLayout();
    }
  };

})();