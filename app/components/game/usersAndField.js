import { GameContext } from "./Context";
import { GameField } from "./GameField";
import { generateBoard } from "./generateBoard";
import { Framework } from "../../framework";
import { createGameUI } from "./Container";
import { Box } from "./Box";
import { setUp } from "./bomberman";
export { joinGame, handleFieldAndUsers }

const framework = new Framework();

// joinGame takes care of first player & sends gamefield to backend
const joinGame = (ws, data) => {
    if (GameContext.playerCount > 1) return;
    const [playerId] = Object.values(data.payload);
    GameContext.isFirstPlayer = true;
    console.log("You are the first player. Creating game field...");
    GameContext.gameField = new GameField();
    generateBoard(GameContext.container, GameContext.gameField);
    const player = GameContext.playerManager.addPlayer(playerId, 0, data.payload);
    player.isLocal = true;
    GameContext.player = player;
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'playground',
            payload: { gameField: GameContext.gameField.boxList }
        }));
    }
    setUp(GameContext.container);
};
// createBoard creates html elelents set for gamefield
const createBoard = (container, gameField) => {
    framework.appendChildren(container, createGameUI());
    gameField.generateHTMLElement(container);
    let index = 0;
    for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            const box = gameField.boxList[index];
            box.generateHTMLElement(container, index + 1, i, j);
            index++;
        }
    }
}
// handleFieldAndUsers takes care of the received game field and players - local and remote
const handleFieldAndUsers = (data) => {
    const { gameField, rooms } = data.payload;
    if (!gameField || !rooms) {
        console.warn("Game field or rooms data is incomplete. Waiting...");
        return;
    }

    if (!GameContext.gameField) {
        GameContext.gameField = new GameField();
        GameContext.gameField.boxList = gameField.map(boxData => {
            return new Box(boxData.breakable, parseInt(boxData.height), parseInt(boxData.width));
        });
        createBoard(GameContext.container, GameContext.gameField);
    }

    // Find the current game the local player is in
    const gameKey = Object.keys(rooms).find(key => rooms[key] === GameContext.player.id);
    const usersIDs = Object.values(rooms);
    usersIDs.sort((a, b) => (a === GameContext.player.id ? -1 : b === GameContext.player.id ? 1 : 0));

    const gameNumber = parseInt(gameKey.replace('game', ''), 10);

    usersIDs.forEach(playerId => {

        if (!GameContext.players.has(playerId)) {
            const player = GameContext.playerManager.addPlayer(playerId, gameNumber, rooms);
            if (playerId === GameContext.player.id) {
                player.isLocal = true;
                GameContext.player = player;
                console.log(`Local player finalized: ${playerId}`);
            } else {
                console.log(`Remote player added: ${playerId}`);
            }
        }
    });
    setUp(GameContext.container);
}

