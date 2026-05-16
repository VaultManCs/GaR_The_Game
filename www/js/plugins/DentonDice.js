/*:
 * @plugindesc Denton Dice (MV) - Pay 5g, dice if owned else coin, sell dice to NPC tokens. v1.2
 * @author You
 *
 * @help
 * Plugin Commands:
 *   DentonDice Play
 *   DentonDice Sell <playerDieItemId> [qty]
 *
 * Rules:
 * - Costs 5 gold to play.
 * - Player uses coin flip ONLY if they have no Di.
 * - Player uses the Di with the maximum sides they own.
 * - Player can sell Di to NPC.
 * - NPC uses the Di with the maximum sides it has in its inventory (token items).
 * - NPC gives player a coin ONLY if they don't already have one (AFTER paying play fee).
 * - If player wins: reward gold = (player max sides) * (npc max sides).
 */

(function() {
  "use strict";

  // =========================
  // CONFIG (EDIT THESE)
  // =========================
  var DENTON_DICE = {
    npcName: "Denton",
    playCostGold: 5,

    coinItemId: 1, // set to your coin item id
    headsValue: 1,
    tailsValue: 2,

    dice: [
      // { playerDieItemId: 10, sides: 2, npcTokenItemId: 110 },
      // { playerDieItemId: 11, sides: 3, npcTokenItemId: 111 },
      // { playerDieItemId: 12, sides: 6, npcTokenItemId: 112 },
    ],

    npcFallbackSides: 3
  };
// =========================
  // HELPERS
  // =========================
  function itemObj(id) { return $dataItems[Number(id || 0)]; }
  function itemCount(id) { return $gameParty.numItems(itemObj(id)); }
  function gainItem(id, n) { $gameParty.gainItem(itemObj(id), n); }
  function loseItem(id, n) { $gameParty.loseItem(itemObj(id), n); }

  function gainGold(n) { $gameParty.gainGold(Number(n || 0)); }
  function loseGold(n) { $gameParty.loseGold(Number(n || 0)); }
  function gold() { return $gameParty.gold(); }

  function msg(text) { $gameMessage.add(String(text)); }

  function roll1to(sides) {
    sides = Math.max(2, Number(sides || 2));
    return Math.floor(Math.random() * sides) + 1;
  }

  function findDieDefByPlayerItem(playerItemId) {
    playerItemId = Number(playerItemId || 0);
    for (var i = 0; i < DENTON_DICE.dice.length; i++) {
      if (Number(DENTON_DICE.dice[i].playerDieItemId) === playerItemId) return DENTON_DICE.dice[i];
    }
    return null;
  }

  function playerHasAnyDie() {
    for (var i = 0; i < DENTON_DICE.dice.length; i++) {
      var d = DENTON_DICE.dice[i];
      if (d.playerDieItemId && itemCount(d.playerDieItemId) > 0) return true;
    }
    return false;
  }

  function playerMaxSides() {
    var best = 0;
    for (var i = 0; i < DENTON_DICE.dice.length; i++) {
      var d = DENTON_DICE.dice[i];
      if (d.playerDieItemId && itemCount(d.playerDieItemId) > 0) {
        best = Math.max(best, Number(d.sides || 0));
      }
    }
    return best;
  }

  function npcMaxSides() {
    var best = 0;
    for (var i = 0; i < DENTON_DICE.dice.length; i++) {
      var d = DENTON_DICE.dice[i];
      if (d.npcTokenItemId && itemCount(d.npcTokenItemId) > 0) {
        best = Math.max(best, Number(d.sides || 0));
      }
    }
    return best > 0 ? best : Math.max(2, Number(DENTON_DICE.npcFallbackSides || 3));
  }

  function coinFlipValue() {
    return (roll1to(2) === 1) ? DENTON_DICE.headsValue : DENTON_DICE.tailsValue;
  }
function playGame() {
    var npcName = DENTON_DICE.npcName;

    // Pay fee first
    if (gold() < DENTON_DICE.playCostGold) {
      msg(npcName + ": It costs " + DENTON_DICE.playCostGold + " gold to play.");
      return;
    }
    loseGold(DENTON_DICE.playCostGold);

    // Coin only if no dice
    var hasDie = playerHasAnyDie();

    // After paying: if no dice and no coin item, give coin
    if (!hasDie && DENTON_DICE.coinItemId && itemCount(DENTON_DICE.coinItemId) <= 0) {
      gainItem(DENTON_DICE.coinItemId, 1);
      msg(npcName + ": Here, take this coin.");
      msg(npcName + ": Heads = " + DENTON_DICE.headsValue + ", Tails = " + DENTON_DICE.tailsValue);
    }

    var playerSidesUsed = hasDie ? playerMaxSides() : 2;
    var npcSidesUsed = npcMaxSides();

    // Pause after Rolling...
    msg("Rolling...\\!");

    var playerRoll = hasDie ? roll1to(playerSidesUsed) : coinFlipValue();
    var npcRoll = roll1to(npcSidesUsed);

    msg(npcName + ": You scored " + playerRoll);
    msg(npcName + ": I scored " + npcRoll);

    if (playerRoll >= npcRoll) {
      var reward = playerSidesUsed * npcSidesUsed;

      // Announce winner AND pause…
      msg(npcName + ": You won\\!");
      msg("You received " + reward + " gold\\!");

      // …then add gold after OK

     gainGold(reward);

    } else {
      msg(npcName + ": I won");
      msg(npcName + ": Better luck next time");
    }

  }


  function sellToNpc(playerDieItemId, qty) {
    var npcName = DENTON_DICE.npcName;

    playerDieItemId = Number(playerDieItemId || 0);
    qty = Math.max(1, Number(qty || 1));

    if (!playerDieItemId) {
      msg(npcName + ": You need to specify which Di to sell.\\!");
      return;
    }

    var dieDef = findDieDefByPlayerItem(playerDieItemId);
    if (!dieDef || !dieDef.npcTokenItemId) {
      msg(npcName + ": I don't buy that Di.\\!");
      return;
    }

    if (itemCount(playerDieItemId) < qty) {
      msg(npcName + ": You don't have enough of that Di.\\!");
      return;
    }

    var it = itemObj(playerDieItemId);
    var priceEach = (it && it.price) ? it.price : 0;
    var total = priceEach * qty;

    loseItem(playerDieItemId, qty);
    gainItem(dieDef.npcTokenItemId, qty);

    gainGold(total);

    msg(npcName + ": Sold.\\!");
  }
// =========================
  // PLUGIN COMMANDS (MV)
  // =========================
  var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _pluginCommand.call(this, command, args);

    if (String(command).toLowerCase() !== "dentondice") return;

    var sub = args[0] ? String(args[0]).toLowerCase() : "";

    if (sub === "play") {
      playGame();
      return;
    }

    if (sub === "sell") {
      sellToNpc(args[1], args[2]);
      return;
    }
  };

})();