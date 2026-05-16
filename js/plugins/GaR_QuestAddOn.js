/*:
 * @plugindesc v1.4 - Remappable Quest Log hotkey (toggle open/close) + non-dismissable "New Quest" prompt with first-time/repeat text + repeat auto-close timer (no YEP_ButtonCommonEvents).
 * @author You
 *
 * @param DefaultKeyCode
 * @text Default Key Code
 * @type number
 * @min 0
 * @desc Default keycode for Quest Log hotkey. Q = 81.
 * @default 81
 *
 * @param EnableHotkeyOnMap
 * @text Enable Hotkey on Map
 * @type boolean
 * @default true
 *
 * @param PromptEnabled
 * @text Show New Quest Prompt
 * @type boolean
 * @default true
 *
 * @param FirstPromptText
 * @text First-time Prompt Text
 * @type string
 * @desc Shown the FIRST time a quest is added in this save file. Use {KEY}.
 * @default First quest received! Press {KEY} to open your quest log.
 *
 * @param RepeatPromptText
 * @text Repeat Prompt Text
 * @type string
 * @desc Shown every time AFTER the first quest in this save file. Use {KEY}.
 * @default New quest added! Press {KEY} to view your quest log.
 *
 * @param RepeatAutoCloseSeconds
 * @text Repeat Auto-Close (Seconds)
 * @type number
 * @min 0
 * @desc How long repeat prompts stay visible before auto-hiding. 0 = never auto-close.
 * @default 4
 *
 * @param PromptX
 * @text Prompt X
 * @type number
 * @default 0
 *
 * @param PromptWidth
 * @text Prompt Width
 * @type number
 * @default 816
 *
 * @param PromptHeight
 * @text Prompt Height
 * @type number
 * @default 108
 *
 * @help
 * - Default hotkey is Q (81) until remapped in Options.
 * - Adds an Options entry "Quest Log Key" to remap the hotkey.
 * - Hotkey toggles the Quest Log:
 *    - On map: press hotkey -> open Quest Log
 *    - In Quest Log: press hotkey -> close Quest Log (pop scene)
 * - When "Quest Add x" runs, shows a NON-dismissable on-map prompt window at the BOTTOM of the screen:
 *    - Cannot be closed by OK/Cancel (not $gameMessage).
 *    - Hotkey still works while it is visible.
 *    - Prompt does NOT vanish (logically) when opening the Quest Log.
 *    - First-time prompt clears after returning from the Quest Log.
 *    - Repeat prompt clears after returning from the Quest Log OR auto-closes after RepeatAutoCloseSeconds.
 * - Prompt text supports {KEY} placeholder.
 */

(function() {
  "use strict";

  var PLUGIN_NAME = "QuestLogShortcut";
  var params = PluginManager.parameters(PLUGIN_NAME);

  var DEFAULT_KEY_CODE  = Number(params.DefaultKeyCode || 81); // Q
  var ENABLE_HOTKEY_MAP = String(params.EnableHotkeyOnMap || "true") === "true";

  var PROMPT_ENABLED      = String(params.PromptEnabled || "true") === "true";
  var FIRST_PROMPT_TEXT   = String(params.FirstPromptText || "First quest received! Press {KEY} to open your quest log.");
  var REPEAT_PROMPT_TEXT  = String(params.RepeatPromptText || "New quest added! Press {KEY} to view your quest log.");

  var REPEAT_AUTO_SECONDS = Number(params.RepeatAutoCloseSeconds || 0); // 0 = never

  var PROMPT_X = Number(params.PromptX || 0);
  var PROMPT_W = Number(params.PromptWidth || 816);
  var PROMPT_H = Number(params.PromptHeight || 108);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function keyNameFromCode(code) {
    if (code >= 65 && code <= 90) return String.fromCharCode(code); // A-Z
    if (code >= 48 && code <= 57) return String.fromCharCode(code); // 0-9

    var map = {
      8: "Backspace", 9: "Tab", 13: "Enter",
      16: "Shift", 17: "Ctrl", 18: "Alt",
      27: "Esc", 32: "Space",
      37: "Left", 38: "Up", 39: "Right", 40: "Down"
    };
    return map[code] || ("Key(" + code + ")");
  }

  function readNumber(config, name, defaultValue) {
    var value = config ? config[name] : undefined;
    if (value === undefined || value === null) return defaultValue;
    value = Number(value);
    return Number.isNaN(value) ? defaultValue : value;
  }

  function questSceneCtor() {
    if (typeof Scene_QuestJournal === "function") return Scene_QuestJournal;
    if (typeof Scene_Quest === "function") return Scene_Quest;
    if (typeof Scene_QuestLog === "function") return Scene_QuestLog;
    return null;
  }

  function isQuestScene(scene) {
    var ctor = questSceneCtor();
    return ctor ? (scene instanceof ctor) : false;
  }

  function clearPromptState() {
    if (!$gameTemp) return;
    $gameTemp._qls_promptActive = false;
    $gameTemp._qls_promptSeenInLog = false;
    $gameTemp._qls_promptTemplate = null;
    $gameTemp._qls_promptType = null; // "first" or "repeat"
    $gameTemp._qls_repeatFramesLeft = 0;
  }

  // -------------------------------------------------------------------------
  // Game_System flag: has the player ever received a quest (this save file)?
  // -------------------------------------------------------------------------
  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    this._qlsHasReceivedAnyQuest = false;
  };

  // -------------------------------------------------------------------------
  // Config: default Q until remapped
  // -------------------------------------------------------------------------
  ConfigManager.questLogKeyCode = DEFAULT_KEY_CODE;

  var _ConfigManager_makeData = ConfigManager.makeData;
  ConfigManager.makeData = function() {
    var config = _ConfigManager_makeData.call(this);
    config.questLogKeyCode = this.questLogKeyCode;
    return config;
  };

  var _ConfigManager_applyData = ConfigManager.applyData;
  ConfigManager.applyData = function(config) {
    _ConfigManager_applyData.call(this, config);
    this.questLogKeyCode = readNumber(config, "questLogKeyCode", DEFAULT_KEY_CODE);
    applyQuestLogBinding();
  };

  // -------------------------------------------------------------------------
  // Input mapping (questLog)
  // -------------------------------------------------------------------------
  function removeExistingQuestLogBindings() {
    Object.keys(Input.keyMapper).forEach(function(k) {
      if (Input.keyMapper[k] === "questLog") delete Input.keyMapper[k];
    });
  }

  function applyQuestLogBinding() {
    removeExistingQuestLogBindings();
    Input.keyMapper[ConfigManager.questLogKeyCode] = "questLog";
  }

  var _Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function() {
    _Scene_Boot_start.call(this);
    applyQuestLogBinding();
  };

  // -------------------------------------------------------------------------
  // Options UI: show & remap hotkey
  // -------------------------------------------------------------------------
  var _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
  Window_Options.prototype.addGeneralOptions = function() {
    _Window_Options_addGeneralOptions.call(this);
    this.addCommand("Quest Log Key", "questLogKey");
  };

  var _Window_Options_statusText = Window_Options.prototype.statusText;
  Window_Options.prototype.statusText = function(index) {
    var symbol = this.commandSymbol(index);
    if (symbol === "questLogKey") {
      return keyNameFromCode(ConfigManager.questLogKeyCode);
    }
    return _Window_Options_statusText.call(this, index);
  };

  var _Window_Options_processOk = Window_Options.prototype.processOk;
  Window_Options.prototype.processOk = function() {
    var symbol = this.commandSymbol(this.index());
    if (symbol === "questLogKey") {
      SceneManager.push(Scene_QuestLogKeyConfig);
      return;
    }
    _Window_Options_processOk.call(this);
  };

  function Scene_QuestLogKeyConfig() { this.initialize.apply(this, arguments); }
  Scene_QuestLogKeyConfig.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_QuestLogKeyConfig.prototype.constructor = Scene_QuestLogKeyConfig;

  Scene_QuestLogKeyConfig.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
    this._handler = null;
  };

  Scene_QuestLogKeyConfig.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createHelpWindow();
    this._helpWindow.setText("Press a key to bind Quest Log.\n(Enter/Arrow keys ignored. Esc cancels.)");
  };

  Scene_QuestLogKeyConfig.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    var self = this;
    this._handler = function(ev) { self.onKeyDown(ev); };
    document.addEventListener("keydown", this._handler);
  };

  Scene_QuestLogKeyConfig.prototype.terminate = function() {
    Scene_MenuBase.prototype.terminate.call(this);
    if (this._handler) document.removeEventListener("keydown", this._handler);
    this._handler = null;
  };

  Scene_QuestLogKeyConfig.prototype.onKeyDown = function(ev) {
    var code = ev.keyCode;

    if (code === 27) {
      SoundManager.playCancel();
      this.popScene();
      return;
    }

    if (code === 13 || (code >= 37 && code <= 40)) {
      SoundManager.playBuzzer();
      return;
    }

    ConfigManager.questLogKeyCode = code;
    ConfigManager.save();
    applyQuestLogBinding();

    SoundManager.playOk();
    this.popScene();
  };

  // -------------------------------------------------------------------------
  // Non-dismissable "New Quest" prompt window (not $gameMessage)
  // -------------------------------------------------------------------------
  function Window_QuestLogPrompt() {
    this.initialize.apply(this, arguments);
  }

  Window_QuestLogPrompt.prototype = Object.create(Window_Base.prototype);
  Window_QuestLogPrompt.prototype.constructor = Window_QuestLogPrompt;

  Window_QuestLogPrompt.prototype.initialize = function() {
    var x = PROMPT_X;
    var y = Graphics.boxHeight - PROMPT_H; // bottom of screen
    Window_Base.prototype.initialize.call(this, x, y, PROMPT_W, PROMPT_H);
    this.openness = 255;
    this._lastText = "";
    this.refresh();
  };

  Window_QuestLogPrompt.prototype.standardPadding = function() {
    return 18;
  };

  Window_QuestLogPrompt.prototype.refresh = function() {
    this.contents.clear();
    var text = currentPromptText();
    this._lastText = text;
    this.drawTextEx(text, 0, 0);
  };

  Window_QuestLogPrompt.prototype.update = function() {
    Window_Base.prototype.update.call(this);

    var shouldShow = PROMPT_ENABLED && $gameTemp && $gameTemp._qls_promptActive;
    this.visible = !!shouldShow;
    if (!this.visible) return;

    var text = currentPromptText();
    if (text !== this._lastText) this.refresh();
  };

  function currentPromptText() {
    var keyName = keyNameFromCode(ConfigManager.questLogKeyCode);
    var template = ($gameTemp && $gameTemp._qls_promptTemplate) ? $gameTemp._qls_promptTemplate : REPEAT_PROMPT_TEXT;
    return template.replace("{KEY}", keyName);
  }

  // -------------------------------------------------------------------------
  // Quest-added detection: intercept "Quest Add x"
  // -------------------------------------------------------------------------
  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);

    if (!command) return;
    var cmd = String(command).toLowerCase();

    if (cmd === "quest" && args && args.length >= 2) {
      var sub = String(args[0]).toLowerCase();
      if (sub === "add") onQuestAdded();
    }
  };

  function onQuestAdded() {
    if (!$gameTemp) return;

    var firstTime = ($gameSystem && !$gameSystem._qlsHasReceivedAnyQuest);
    if ($gameSystem) $gameSystem._qlsHasReceivedAnyQuest = true;

    $gameTemp._qls_promptType = firstTime ? "first" : "repeat";
    $gameTemp._qls_promptTemplate = firstTime ? FIRST_PROMPT_TEXT : REPEAT_PROMPT_TEXT;

    $gameTemp._qls_promptActive = true;
    $gameTemp._qls_promptSeenInLog = false;

    // Only repeats can auto-close (first-time stays until viewed in log)
    if (!firstTime && REPEAT_AUTO_SECONDS > 0) {
      $gameTemp._qls_repeatFramesLeft = Math.max(1, Math.round(REPEAT_AUTO_SECONDS * 60));
    } else {
      $gameTemp._qls_repeatFramesLeft = 0;
    }
  }

  // -------------------------------------------------------------------------
  // Repeat auto-close timer: counts down even if you open the quest log
  // -------------------------------------------------------------------------
  var _Scene_Base_update2 = Scene_Base.prototype.update;
  Scene_Base.prototype.update = function() {
    _Scene_Base_update2.call(this);

    if ($gameTemp && $gameTemp._qls_promptActive && $gameTemp._qls_promptType === "repeat") {
      if ($gameTemp._qls_repeatFramesLeft > 0) {
        $gameTemp._qls_repeatFramesLeft--;
        if ($gameTemp._qls_repeatFramesLeft <= 0) {
          // Auto-close ONLY for repeat prompts
          clearPromptState();
        }
      }
    }

    // Allow hotkey to close quest log from inside that scene.
    if (Input.isTriggered("questLog")) {
      closeQuestLogIfOpen();
    }
  };

  // -------------------------------------------------------------------------
  // Open / close Quest Log (toggle)
  // -------------------------------------------------------------------------
  function openQuestLog() {
    var ctor = questSceneCtor();
    if (ctor) {
      if ($gameTemp && $gameTemp._qls_promptActive) $gameTemp._qls_promptSeenInLog = true;
      SceneManager.push(ctor);
      return true;
    }
    SceneManager.push(Scene_Menu);
    return false;
  }

  function closeQuestLogIfOpen() {
    if (isQuestScene(SceneManager._scene)) {
      SceneManager.pop();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Map scene: create prompt window + hotkey open
  // -------------------------------------------------------------------------
  var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function() {
    _Scene_Map_createAllWindows.call(this);
    this._qlsPromptWindow = new Window_QuestLogPrompt();
    this.addWindow(this._qlsPromptWindow);
  };

  // When returning to the map, clear prompt after the quest log has been viewed.
  // (Still applies to both first + repeat; repeat may also auto-close earlier.)
  var _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function() {
    _Scene_Map_start.call(this);

    if ($gameTemp && $gameTemp._qls_promptActive && $gameTemp._qls_promptSeenInLog) {
      clearPromptState();
    }
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);

    if (!ENABLE_HOTKEY_MAP) return;

    if (Input.isTriggered("questLog")) {
      openQuestLog();
    }
  };

})();