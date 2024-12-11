export class GameState {
    constructor() {
        this.timestamp = 0;
        this.players = new Map();
        this.bombs = new Map();
        this.powerUps = new Map();
        this.walls = new Set();
        this.breakableWalls = new Set();
    }

    serialize() {
        return {
            timestamp: this.timestamp,
            players: Array.from(this.players.entries()),
            bombs: Array.from(this.bombs.entries()),
            powerUps: Array.from(this.powerUps.entries()),
            walls: Array.from(this.walls),
            breakableWalls: Array.from(this.breakableWalls)
        };
    }

    deserialize(data) {
        this.timestamp = data.timestamp;
        this.players = new Map(data.players);
        this.bombs = new Map(data.bombs);
        this.powerUps = new Map(data.powerUps);
        this.walls = new Set(data.walls);
        this.breakableWalls = new Set(data.breakableWalls);
    }
}
