import { baseSquare } from "./movement";
import { Framework } from "../../framework";

const framework = new Framework();

export class Player {
  constructor(speed = 2, x = 0, y = 0) {
    this.height = baseSquare;
    this.width = baseSquare;
    this.className = "bomberman";
    this.speed = speed;
    this.bombLength = 1;
    this.bombTimer = 3000;
    this.activeBombs = 0;
    this.maxBombs = 1;
    this.bombId = 0;
    this.bombArray = [];
    this.x = x;
    this.y = y;
    this.centerX = this.x + (this.width / 2)
    this.centerY = this.y + (this.height / 2)
    this.rightBlock = false;
    this.leftBlock = false;
    this.downBlock = false;
    this.upBlock = false;
    this.idOnLeftTop = 0;
    this.idOnLeftBottom = 0;
    this.idOnRightTop = 0;
    this.idOnRightBottom = 0;
    this.idOnCenter = 1;
    this.lives = 3;
    this.invulnerable = false;
    this.score = 0;
    this.spritePos = 0;
    this.spriteLength = 7;
    this.id = 0;
    this.isLocal = true;
    this.playerColor = 'white';
    this.playerElement = null;
  }

  generateHTMLElement(container) {
    const div = framework.createElement('div', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`,
        backgroundImage: `url(/assets/images/players/bomberman_${this.playerColor}.png)`,
        position: 'absolute',
        transform: `translate3d(${this.x}px, ${this.y}px, 0)`
      },
      class: this.className,
      id: `player-${this.id}`
    });
    this.playerElement = div;
    framework.appendChildren(container.querySelector(".field"), div);
  }
}