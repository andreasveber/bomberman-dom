import { Player } from './Player';
import { GameContext } from './Context';
import { baseSquare } from './movement';
import { dispatchCustomEvent } from '../../events';

export class PlayerManager {
    constructor() {
        this.startPositions = [
            { x: 0, y: -baseSquare * 10, color: 'white' },
            { x: baseSquare * 9, y: -baseSquare, color: 'green' },
            { x: baseSquare * 9, y: -baseSquare * 10, color: 'pink' },
            { x: 0, y: -baseSquare, color: 'blue' }
        ];
    }

    addPlayer(playerId, gameNumber, rooms) {
        if (GameContext.players.size > 4) return;
        //for remotes check to which game belongs player
        const gameKey = Object.keys(rooms).find(key => rooms[key] === playerId);
        const remoteGameNumber = parseInt(gameKey.replace('game', ''), 10);
        const position = this.startPositions[gameNumber !== remoteGameNumber ? remoteGameNumber : gameNumber];
        const player = new Player(4, position.x, position.y);
        player.id = playerId;
        player.playerColor = position.color;
        player.isLocal = false;
        GameContext.players.set(playerId, player);
        dispatchCustomEvent('gameTimers', 'playerJoined', { playerId, playerCount: GameContext.players.size });
        GameContext.playerCount = GameContext.players.size;
        player.generateHTMLElement(GameContext.container);


        return player;
    }

    removePlayer(id) {
        GameContext.players.delete(id);
    }

    getAlivePlayersCount() {
        return Array.from(GameContext.players.values()).filter(p => p.lives > 0).length;
    }
}

