import { GameContext } from "./Context";
import { setExplodeWave, bombInSquare, pauseBomb, restartBomb } from "./bombardment";
import { countdown, setPausedTrue, setPausedFalse } from "./countdown";
import { handleEvent } from "../../events";
import { Bomb } from "./Bomb";
import { fireStarter } from "./startupTimers";

//import { baseSquaresX } from "./bombardment";
//import { step } from "./bomberman";

let gameInit = false;

const InitializeGameEvents = (container) => {
    if (gameInit) return;

    container.setAttribute('tabindex', '0');
    container.focus();

    // Handle both keydown and keyup events
    handleEvent("gamePage", container, "keydown", (e) => handleGameKeyEvents(e, true));
    handleEvent("gamePage", container, "keyup", (e) => handleGameKeyEvents(e, false));

    gameInit = true;
};

const handleGameKeyEvents = (e, isKeyDown) => {
    e.preventDefault();

    // Movement handling
    if (isKeyDown) {
        updateDirection(e, true);
    } else {
        updateDirection(e, false);
    }

    // Additional game controls (only on keydown)


    if (isKeyDown) {
        if ((e.code === "Enter" || e.code === "NumpadEnter") && GameContext.gamePause) {
            if (GameContext.gameStart && GameContext.gamePause) {
                location.reload();
            }
            if (GameContext.ws.readyState === WebSocket.OPEN) {
                console.log("Restarting WS request")
                ws.send(JSON.stringify({
                    type: 'game_start',
                    payload: {}
                }));
            }
            //fireStarter();
        }

        if (e.code === "Space" && GameContext.player.activeBombs < GameContext.player.maxBombs && !GameContext.gamePause && !bombInSquare(GameContext.player.idOnCenter, GameContext.player.bombArray)) {
            setBomb(GameContext.player);
        }
        if (e.code === "Escape" && GameContext.gameStart && !GameContext.gameEnd) {
            setPause(GameContext.container, !GameContext.gamePause);
        }
    }
};

const startGame = (container) => {
    const pauseOverlay = container.querySelector(".pause-screen");
    pauseOverlay.classList.toggle("active");
    container.querySelector("#start").textContent = 'Press R to restart the game logout for exit...';
    container.querySelector("#info").textContent = 'Paused';
    GameContext.gamePause = false;
    GameContext.gameStart = true;
    countdown(container);
}


const setPause = (container, pause) => {
    container.querySelector(".pause-screen").classList.toggle("active", pause);
    GameContext.gamePause = pause;
    pause ? setPausedTrue() : setPausedFalse();
    countdown(container);
    GameContext.player.bombArray.forEach(b => (pause ? pauseBomb(b) : restartBomb(b)));
}

const setBomb = (player) => {
    player.activeBombs++;
    player.bombId++;
    const boxElement = GameContext.container.querySelector("#box" + player.idOnCenter);
    const bomb = new Bomb({
        x: boxElement.offsetLeft,
        y: boxElement.offsetTop
    }, player.bombId);


    bomb.started = new Date().getTime();
    bomb.idOnCenter = player.idOnCenter;
    player.bombArray.push(bomb);
    bomb.generateHTMLElement(GameContext.container);
    setExplodeWave(player.bombTimer, bomb);


    if (player.isLocal && GameContext.ws && GameContext.ws.readyState === WebSocket.OPEN) {
        GameContext.ws.send(JSON.stringify({
            type: 'bomb_placed',
            payload: {
                playerId: player.id,
                x: boxElement.offsetLeft,
                y: boxElement.offsetTop,
                bombId: bomb.id,
                idOnCenter: player.idOnCenter
            }
        }, null, 0));
    }
}



const getKeys = () => ({
    38: GameContext.directions.up,
    37: GameContext.directions.left,
    39: GameContext.directions.right,
    40: GameContext.directions.down,
});

// Adds or removes direction in held_directions based on key press/release
const updateDirection = (e, add) => {
    const keys = getKeys();
    const dir = keys[e.which];
    const index = GameContext.held_directions.indexOf(dir);
    if (add && dir && index === -1) {
        GameContext.held_directions.unshift(dir);
    } else if (!add && index > -1) {
        GameContext.held_directions.splice(index, 1);
    }
};
// Adds or removes direction in held_directions based on key press/release





export { startGame, InitializeGameEvents };