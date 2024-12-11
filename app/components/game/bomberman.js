import { GameContext } from "./Context";
import { initializeWebSocket } from "./gameSockets";
import { store } from "../../store";
import { Player } from "./Player";
import { PlayerManager } from "./PlayerManager";
import { setupJoinGameLogic } from "./startupTimers";
import { countdown, setPausedTrue, timeOver } from "./countdown";
import { saveStatsInStore } from "../statsNavBar";
import { movePlayer, checkPowerUpCollision } from "./movement";
import { pauseBomb } from "./bombardment";


export { setUp, gameOver }

export function InitGame(container) {
  GameContext.container = container
  GameContext.powerUps = [];
  const playerId = store.state.user.details?.id;
  GameContext.playerManager = new PlayerManager;
  GameContext.player = new Player();
  GameContext.player.id = playerId;
  GameContext.player.isLocal = true;

  initializeWebSocket();
  setupJoinGameLogic(GameContext.ws, container);
}

const setUp = (container) => {
  GameContext.field = container.querySelector(".field");
  GameContext.fieldRect = GameContext.field.getBoundingClientRect();
  GameContext.bomberman = container.querySelector(".bomberman");
  GameContext.bombermanRect = GameContext.bomberman.getBoundingClientRect();
  GameContext.rightLimit = GameContext.fieldRect.width - GameContext.bombermanRect.width;
  GameContext.topLimit = -GameContext.fieldRect.height;
  GameContext.bottomLimit = -GameContext.bombermanRect.height;
  saveStatsInStore();
}

const updateGameOverText = (cont) => {
  cont.querySelector("#start").textContent =
    GameContext.players.size > 1 ? "No one won this game" :
      GameContext.player.lives < 1 ? "GAME OVER! You lost all your lives." :
        "GAME OVER! You're the Winner.";
  // cont.querySelector("#pause").textContent = "Your final score: " + GameContext.player.score;
  cont.querySelector("#bomb").textContent = "Thank You for playing!";
  cont.querySelector("#info").textContent = 'Press "Enter" to restart the game.';
};

// Ends the game, pauses everything, and displays "Game Over" screen
const gameOver = (cont) => {
  GameContext.gamePause = true;
  setPausedTrue();
  countdown(cont);
  GameContext.player.bombArray.forEach(pauseBomb);
  updateGameOverText(cont);
  cont.querySelector(".pause-screen").classList.toggle("active");
  updateStats(cont);
};

// Updates player statistics on the screen
const updateStats = (cont) => {
  cont.querySelector("#span__players").textContent = GameContext.playerCount;
  cont.querySelector("#lives").textContent = "Lives: " + GameContext.player.lives;
  saveStatsInStore();
};

// Main update loop that handles game logic and checks for game-over conditions
const updateLoop = () => {
  if (GameContext.player.lives < 1) {
    removeActivePlayer();
  }
  if ((GameContext.player.lives < 1 || timeOver) && !GameContext.gameEnd) {

    setTimeout(gameOver(GameContext.container), 1000);
    GameContext.gameEnd = true;
  }
  movePlayer(GameContext.container, GameContext.player);
  checkPowerUpCollision(GameContext.container, GameContext.player);
  updateStats(GameContext.container);
};

// FPS settings and frame control variables
GameContext.fps = 60;
GameContext.then = Date.now();
GameContext.interval = 1000 / GameContext.fps;


export const step = () => {
  requestAnimationFrame(step);
  GameContext.now = Date.now();
  GameContext.delta = GameContext.now - GameContext.then;

  if (GameContext.delta > GameContext.interval) {
    GameContext.then = GameContext.now - (GameContext.delta % GameContext.interval);
    if (!GameContext.gamePause) {
      updateLoop();
    }
  }
};

const removeActivePlayer = () => {
  const playerId = GameContext.player.id
  GameContext.playerManager.removePlayer(playerId);
  GameContext.playerCount--;
  if (GameContext.ws.readyState === WebSocket.OPEN) {
    console.log("Restarting WS request")
    GameContext.ws.send(JSON.stringify({
      type: 'player_gone',
      payload: { playerId }
    }));
  }
}