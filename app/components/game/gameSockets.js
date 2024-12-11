import { GameContext } from "./Context";
import { store } from "../../store";
import { joinGame, handleFieldAndUsers } from "./usersAndField";
import { timerSocket } from "./startupTimers";
import { Bomb } from "./Bomb";
import { explodeWave } from "./bombardment";
import { setExplodeWave } from "./bombardment";
import { fireStarter } from "./startupTimers";
import { PowerUp } from "./PowerUp";
import { gameOver } from "./bomberman";


let ws = null;
export const initializeWebSocket = () => {
    const nickname = store.state.user.details?.nickname;
    ws = new WebSocket(`ws://localhost:8080/game?nickname=${nickname}`);
    ws.onopen = () => {
        console.log("Websocket game opened")
        ws.send(JSON.stringify({
            type: 'player_joined',
            payload: {}
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'player_joined' ||
            data.type === 'playground' ||
            data.type === 'player_moved' ||
            data.type === 'bomb_placed' ||
            data.type === 'bomb_exploded' ||
            data.type === 'player_hit' ||
            data.type === 'player_gone' ||
            data.type === 'timer_start' ||
            data.type === 'game_start' ||
            data.type === 'field_update' ||
            data.type === 'powerup_collected' ||
            data.type === 'powerup_spawned') {
            handleWebSocketMessage(data);
        } else {
            console.log("Not a game type messages")
        }
    };
    ws.onclose = () => console.log('WebSocket game closed');
    ws.onerror = error => console.error('WebSocket game error:', error);

    GameContext.ws = ws;
};

const handleWebSocketMessage = (data) => {

    switch (data.type) {
        case 'player_joined':
            console.log("Joined", data.payload)
            joinGame(ws, data)
            break;
        case 'playground':
            handleFieldAndUsers(data)
            break;
        case 'timer_start':
            console.log("TimerWait")
            timerSocket(data)
            break;
        case 'game_start':
            console.log("Game Restart request received!");
            fireStarter();
            break;
        case 'player_moved':
            updateRemotePlayerPosition(data.payload);
            break;
        case 'player_gone':
            playerGone(data)
            break;
        case 'bomb_placed':
            remoteBomb(data.payload);
            break;
        case 'field_update':
            fieldUpdate(data);
            break;
        case 'player_hit':
            playerHit(data);
            break;
        case 'bomb_exploded':
            explodedBomb(data);
            break;
        case 'powerup_collected':
            collectedPowerUp(data);
            break;
        case 'powerup_spawned':
            powerSpanned(data);
            break;
    }
};

const playerGone = (data) => {
    console.log("player gone", data.payload.playerId)
    GameContext.playerManager.removePlayer(data.payload.playerId);
    GameContext.playerCount--;
    if (GameContext.playerCount === 1) {
        gameOver(GameContext.container);
    }
}

const powerSpanned = (data) => {
    const powerUp = new PowerUp(
        data.payload.type,
        data.payload.position,
        data.payload.id
    );
    powerUp.generateHTMLElement(GameContext.container);
    GameContext.powerUps.push(powerUp);
}
const collectedPowerUp = (data) => {
    const player = GameContext.players.get(data.payload.playerId);
    if (player) {
        // Remove the power-up element using the correct data-id attribute
        const powerUpElement = GameContext.container.querySelector(`.power-up[data-id="${data.payload.powerUpId}"]`);
        if (powerUpElement) {
            powerUpElement.remove();
        }
        // Only apply the power-up effect to the collecting player
        if (!player.isLocal) {
            const powerUp = new PowerUp(data.payload.powerUpType, { x: 0, y: 0 });
            powerUp.apply(player);
        }
        // Remove from GameContext.powerUps array using find instead of direct index
        const powerUpIndex = GameContext.powerUps.findIndex(p => p.id === data.payload.powerUpId);
        if (powerUpIndex !== -1) {
            GameContext.powerUps[powerUpIndex].collected = true;
            GameContext.powerUps.splice(powerUpIndex, 1);
        }
    }
}
const explodedBomb = (data) => {
    const bombOwner = GameContext.players.get(data.payload.playerId);
    if (bombOwner && !bombOwner.isLocal) {
        const bomb = bombOwner.bombArray.find(b => b.id === data.payload.bombId);
        if (bomb) {
            clearTimeout(bomb.timeOutId);
            explodeWave(GameContext.container, bomb);
        }
    }
}
const fieldUpdate = (data) => {
    const squareElement = GameContext.container.querySelector("#box" + data.payload.squareId);
    if (squareElement) {
        squareElement.classList.remove("box__breakable");
        squareElement.classList.add("box__hidden");
    }
}
const updateRemotePlayerPosition = (data) => {
    const player = GameContext.players.get(data.playerId);
    if (player && !player.isLocal) {
        player.x = data.x;
        player.y = data.y;
        player.spritePos = data.spritePos || 0;

        if (player.playerElement) {
            player.playerElement.style.transform = `translate3d(${data.x}px, ${data.y}px, 0)`;

            // Update sprite animation
            let spriteOffset;
            switch (data.direction) {
                case 'up': spriteOffset = '0px'; break;
                case 'left': spriteOffset = '60px'; break;
                case 'down': spriteOffset = '120px'; break;
                case 'right': spriteOffset = '180px'; break;
                default: spriteOffset = '0px';
            }

            player.playerElement.style.backgroundPosition =
                `${player.spritePos * -60}px ${spriteOffset}`;
        }
    }
};
const remoteBomb = (data) => {
    const player = GameContext.players.get(data.playerId);
    if (player && !player.isLocal) {
        player.activeBombs++;
        player.bombId++;
        const boxElement = GameContext.container.querySelector("#box" + data.idOnCenter);
        const bomb = new Bomb({
            x: boxElement.offsetLeft,
            y: boxElement.offsetTop
        }, data.bombId);

        bomb.started = new Date().getTime();
        bomb.idOnCenter = data.idOnCenter;
        player.bombArray.push(bomb);
        bomb.generateHTMLElement(GameContext.container);
        setExplodeWave(player.bombTimer, bomb);
    }
};
const playerHit = (data) => {
    const hitPlayer = GameContext.players.get(data.payload.playerId);
    if (hitPlayer) {
        hitPlayer.lives = data.payload.lives;
        hitPlayer.invulnerable = true;

        // Get the specific player's element
        let playerDiv = GameContext.container.querySelector(`#player-${hitPlayer.id}`);
        if (!playerDiv) return;

        // Start blinking animation for remote player
        let onOff = true;
        let blinker = setInterval(() => {
            playerDiv.style.opacity = onOff ? "0" : "1";
            onOff = !onOff;
        }, 200);

        setTimeout(() => {
            clearInterval(blinker);
            playerDiv.style.opacity = "1";
            hitPlayer.invulnerable = false;
        }, 1200);
    }
}