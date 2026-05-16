/*:
 * @plugindesc (MV) Event-specific battle text/behaviour overrides (keeps original battles unchanged unless an event enables it). v1.0
 * @author You
 *
 * @help
 * This plugin does NOT replace Scene_Battle or encounters. Battles work normally. [1](https://onedrive.live.com/?id=055eca02-885a-4037-bf66-dfbe847d407b&cid=82b98afb5a2973ef&web=1)
 *
 * Instead, you enable "Override Mode" from an EVENT (just before Battle Processing),
 * and the changes apply ONLY to that battle (or until you disable them).
 *
 * Plugin Commands (use in an event):
 *   CSBattleOverride ON
 *   CSBattleOverride OFF
 *   CSBattleOverride ONCE
 *
 * - ON   : overrides stay active until OFF
 * - ONCE : overrides apply for the next battle only, then auto-disable after battle ends
 *
 * Optional: you can limit the override to a specific Troop ID via parameter.
 *
 * @param TargetActorId
 * @type number
 * @min 0
 * @default 0
 * @desc 0 = apply to all actors (during override); otherwise only this Actor ID is affected.
 *
 * @param TroopIdFilter
 * @type number
 * @min 0
 * @default 0
 * @desc 0 = any troop; otherwise overrides only apply when fighting this troop ID.
 *
 * @param ---Command Text (During Override)---
 * @default
 * @param AttackCommandText
 * @parent ---Command Text (During Override)---
 * @type string
 * @default Attack
 *
 * @param GuardCommandText
 * @parent ---Command Text (During Override)---
 * @type string
 * @default Guard
 *
 * @param ItemCommandText
 * @parent ---Command Text (During Override)---
 * @type string
 * @default Item
 *
 * @param ---Behaviour (During Override)---
 * @default
 * @param AttackSkillIdOverride
 * @parent ---Behaviour (During Override)---
 * @type number
 * @min 0
 * @default 0
 * @desc 0 = normal attack; otherwise Attack uses this skill ID (during override).
 *
 * @param GuardSkillIdOverride
 * @parent ---Behaviour (During Override)---
 * @type number
 * @min 0
 * @default 0
 * @desc 0 = normal guard; otherwise Guard uses this skill ID (during override).
 *
 * @param ---Battle Log Text (During Override)---
 * @default
 * @param SkillLine1
 * @parent ---Battle Log Text (During Override)---
 * @type string
 * @default {user} uses {item}!
 *
 * @param SkillLine2
 * @parent ---Battle Log Text (During Override)---
 * @type string
 * @default
 *
 * @param ItemLine
 * @parent ---Battle Log Text (During Override)---
 * @type string
 * @default {user} uses {item}.
 */



(function() {
  "use strict";

  var PLUGIN_NAME = "CS_EventBattleOverrides";
  var P = PluginManager.parameters(PLUGIN_NAME);

  var TARGET_ACTOR_ID = Number(P.TargetActorId || 0);
  var TROOP_FILTER_ID = Number(P.TroopIdFilter || 0);

  var CMD_ATTACK = String(P.AttackCommandText || "Attack");
  var CMD_GUARD  = String(P.GuardCommandText  || "Guard");
  var CMD_ITEM   = String(P.ItemCommandText   || "Item");

  var ATK_SKILL_ID = Number(P.AttackSkillIdOverride || 0);
  var GRD_SKILL_ID = Number(P.GuardSkillIdOverride  || 0);

  var LOG_SKILL_1 = String(P.SkillLine1 || "{user} uses {item}!");
  var LOG_SKILL_2 = String(P.SkillLine2 || "");
  var LOG_ITEM    = String(P.ItemLine   || "{user} uses {item}.");

  // Stored in $gameTemp so it is session-safe and easy to reset.
  function ensureTemp() {
    if (!$gameTemp) return;
    if ($gameTemp._csBattleOverrideMode == null) $gameTemp._csBattleOverrideMode = "off"; // off|on|once
    if ($gameTemp._csBattleOverrideUsed == null) $gameTemp._csBattleOverrideUsed = false;
    if ($gameTemp._csCurrentTroopId == null) $gameTemp._csCurrentTroopId = 0;
  }

  function overrideEnabled() {
    ensureTemp();
    if (!$gameTemp) return false;
    if ($gameTemp._csBattleOverrideMode === "off") return false;

    // Troop filter (optional)
    if (TROOP_FILTER_ID > 0 && $gameTemp._csCurrentTroopId !== TROOP_FILTER_ID) return false;

    return true;
  }

  function actorPassesFilter(battler) {
    if (!battler || !battler.isActor || !battler.isActor()) return false;
    if (TARGET_ACTOR_ID <= 0) return true; // 0 means "any actor"
    return battler.actorId && battler.actorId() === TARGET_ACTOR_ID;
  }

  function fmt(template, userName, itemName) {
    return String(template || "")
      .replace(/\{user\}/gi, userName)
      .replace(/\{item\}/gi, itemName);
  }

  // Plugin command hook
  var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _pluginCommand.call(this, command, args);
    if (String(command).toLowerCase() === "csbattleoverride") {
      ensureTemp();
      var mode = (args && args[0]) ? String(args[0]).toLowerCase() : "off";
      if (mode === "on") {
        $gameTemp._csBattleOverrideMode = "on";
        $gameTemp._csBattleOverrideUsed = false;
      } else if (mode === "once") {
        $gameTemp._csBattleOverrideMode = "once";
        $gameTemp._csBattleOverrideUsed = false;
      } else {
        $gameTemp._csBattleOverrideMode = "off";
        $gameTemp._csBattleOverrideUsed = false;
      }
    }
  };



// Track current troop id when battle is set up
  var _BattleManager_setup = BattleManager.setup;
  BattleManager.setup = function(troopId, canEscape, canLose) {
    ensureTemp();
    if ($gameTemp) $gameTemp._csCurrentTroopId = troopId || 0;
    _BattleManager_setup.call(this, troopId, canEscape, canLose);
  };

  // After battle ends: if mode was ONCE, turn it OFF
  var _BattleManager_endBattle = BattleManager.endBattle;
  BattleManager.endBattle = function(result) {
    ensureTemp();
    _BattleManager_endBattle.call(this, result);

    if ($gameTemp && $gameTemp._csBattleOverrideMode === "once") {
      $gameTemp._csBattleOverrideMode = "off";
      $gameTemp._csBattleOverrideUsed = true;
    }
  };



// --- Actor Command labels (during override) ---
  var _addAttackCommand = Window_ActorCommand.prototype.addAttackCommand;
  Window_ActorCommand.prototype.addAttackCommand = function() {
    if (overrideEnabled() && this._actor && actorPassesFilter(this._actor)) {
      this.addCommand(CMD_ATTACK, "attack", this._actor.canAttack());
      return;
    }
    _addAttackCommand.call(this);
  };

  var _addGuardCommand = Window_ActorCommand.prototype.addGuardCommand;
  Window_ActorCommand.prototype.addGuardCommand = function() {
    if (overrideEnabled() && this._actor && actorPassesFilter(this._actor)) {
      this.addCommand(CMD_GUARD, "guard", this._actor.canGuard());
      return;
    }
    _addGuardCommand.call(this);
  };

  var _addItemCommand = Window_ActorCommand.prototype.addItemCommand;
  Window_ActorCommand.prototype.addItemCommand = function() {
    if (overrideEnabled() && this._actor && actorPassesFilter(this._actor)) {
      this.addCommand(CMD_ITEM, "item");
      return;
    }
    _addItemCommand.call(this);
  };

  // --- Behaviour overrides (during override) ---
  if (Game_Actor.prototype.attackSkillId) {
    var _attackSkillId = Game_Actor.prototype.attackSkillId;
    Game_Actor.prototype.attackSkillId = function() {
      if (overrideEnabled() && actorPassesFilter(this) && ATK_SKILL_ID > 0) {
        return ATK_SKILL_ID;
      }
      return _attackSkillId.call(this);
    };
  }

  if (Game_Actor.prototype.guardSkillId) {
    var _guardSkillId = Game_Actor.prototype.guardSkillId;
    Game_Actor.prototype.guardSkillId = function() {
      if (overrideEnabled() && actorPassesFilter(this) && GRD_SKILL_ID > 0) {
        return GRD_SKILL_ID;
      }
      return _guardSkillId.call(this);
    };
  }

  // --- Battle log text (during override) ---
  var _displayAction = Window_BattleLog.prototype.displayAction;
  Window_BattleLog.prototype.displayAction = function(subject, item) {
    if (overrideEnabled() && actorPassesFilter(subject) && item) {
      var userName = subject.name ? subject.name() : "";
      var itemName = item.name || "";

      var before = this._methods.length;

      if (DataManager.isSkill(item)) {
        if (LOG_SKILL_1) this.push("addText", fmt(LOG_SKILL_1, userName, itemName));
        if (LOG_SKILL_2) this.push("addText", fmt(LOG_SKILL_2, userName, itemName));
      } else {
        if (LOG_ITEM) this.push("addText", fmt(LOG_ITEM, userName, itemName));
      }

      // If nothing was added, fall back to normal MV behaviour.
      if (this._methods.length === before) {
        return _displayAction.call(this, subject, item);
      }
      return;
    }

    _displayAction.call(this, subject, item);
  };

})();