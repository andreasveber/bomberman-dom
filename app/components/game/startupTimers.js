import { GameContext } from "./Context";
import { handleEvent } from "../../events";
import { InitializeGameEvents } from "./gameEvents";
import { movePlayer } from "./movement";
import { step } from "./bomberman";
import { startGame } from "./gameEvents";
export { setupJoinGameLogic, timerSocket, fireStarter }

let waitTimerInterval = null;

const setupJoinGameLogic = (ws, container) => {
    handleEvent('gameTimers', container, 'playerJoined', (event) => {
        const { playerId, playerCount } = event.detail;

        console.log(`Player joined: ${playerId}. Total players: ${playerCount}`);
        const playersInGame = GameContext.container.querySelector('#span__players');
        playersInGame.textContent = playerCount;
        if (GameContext.isFirstPlayer && playerCount >= 2) {
            socketWaiting(ws);

            console.log("Player count >= 2. Managing 20-second waiting timer...");
            // Reset and restart the wait timer locally
            if (waitTimerInterval) {
                clearInterval(waitTimerInterval);
            }
            startWaitTimer(10, () => {
                console.log("Wait timer expired.");
                if (GameContext.players.size > playerCount) {
                    socketWaiting(ws);
                } else {
                    console.log("No additional players. Starting preparation timer...");
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'timer_start',
                            payload: {
                                timerType: 'preparation',
                                remainingTime: 5
                            }
                        }));
                    }
                    startPrepareTimer(5, runGame);
                }
            });
        }
    });
};
// Notify WebSocket to start/restart the waiting timer
const socketWaiting = (ws) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'timer_start',
            payload: {
                timerType: 'waiting',
                remainingTime: 10
            }
        }));
    }
};
// Start a waiting timer locally and clear the previous one
const startWaitTimer = (seconds, callback) => {
    let timer = seconds;
    waitTimerInterval = setInterval(() => {
        timer--;
        if (timer < 0) {
            clearInterval(waitTimerInterval);
            waitTimerInterval = null;
            callback();
        }
    }, 1000);
};
// Start a preparation timer locally
const startPrepareTimer = (seconds, callback) => {
    let timer = seconds;
    const interval = setInterval(() => {
        timer--;
        if (timer < 0) {
            clearInterval(interval);
            callback();
        }
    }, 1000);
};

// Handle incoming WebSocket timer synchronization
const timerSocket = (data) => {
    const { timerType, remainingTime } = data.payload;
    if (timerType === "waiting") {
        startLocalWaitingTimer(remainingTime, () => {
            startLocalPreparationTimer(5);
        });
    } else if (timerType === "preparation") {
        startLocalPreparationTimer(remainingTime);
    }
};
// Local timer for waiting phase
const startLocalWaitingTimer = (remainingTime, onComplete) => {
    if (waitTimerInterval) {
        clearInterval(waitTimerInterval);
    }
    const waitingTimeElement = GameContext.container.querySelector('#wait-time');
    let timeLeft = remainingTime;
    waitTimerInterval = setInterval(() => {
        if (timeLeft > 0) {
            waitingTimeElement.textContent = `${timeLeft} s`;
            timeLeft--;
        } else {
            clearInterval(waitTimerInterval);
            waitTimerInterval = null;
            waitingTimeElement.textContent = '--';
            // Trigger the onComplete callback to handle preparation logic
            if (onComplete) {
                onComplete();
            }
        }
    }, 1000);
};


// Local timer for preparation phase
const startLocalPreparationTimer = (remainingTime) => {
    const prepTimeElement = GameContext.container.querySelector('#prep-time');
    let timeLeft = remainingTime;
    const interval = setInterval(() => {
        if (timeLeft > 0) {
            prepTimeElement.textContent = `${timeLeft} s`;

            timeLeft--;
        } else {
            clearInterval(interval);
            prepTimeElement.textContent = '--';
            console.log("Preparation timer completed.");
            fireStarter();
        }
    }, 1000);
};

const fireStarter = () => {
    InitializeGameEvents(GameContext.container);
    movePlayer(GameContext.container, GameContext.player);
    startGame(GameContext.container)
    step();
}
//this one only resets local timers
const runGame = () => {
    clearTimeout(GameContext.waitingTimer);
    clearTimeout(GameContext.preparationTimer);
    console.log("Game started! All players ready.");
    // game initialization logic
}