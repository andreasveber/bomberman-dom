class GameContextClass {
    constructor() {
        if (!GameContextClass.instance) {

            this.bomberman = null;
            this.bombermanRect = null;
            this.bottomLimit = 0;
            this.container = null;
            this.delta = 0;
            this.directions = {
                up: 'up',
                down: 'down',
                left: 'left',
                right: 'right'
            };
            this.field = null;
            this.fieldRect = null;
            this.fps = 0;
            this.frameCount = 0;
            this.gameStart = false;
            this.gameEnd = false;
            this.gamePause = true;
            this.gameField = null;
            this.held_directions = [];
            this.isFirstPlayer = false;
            this.interval = 0;
            this.leftLimit = 0;
            this.now = null;
            this.then = null;
            this.players = new Map();
            this.player = null;
            this.remotePlayer = null;
            this.playerManager = null;
            this.playerCount = 0;
            this.preparationTimer = null;
            this.rightLimit = 0;
            this.topLimit = 0;
            this.waitingTimer = null
            this.ws = null;
            this.powerUps = [];

            GameContextClass.instance = this;
        }
        return GameContextClass.instance;
    }
}
export const GameContext = new GameContextClass();
