import { baseSquare } from "./movement";
import { Framework } from "../../framework";

const framework = new Framework();

export class Bomb {
  constructor(playerPosition, id) {
    // Set bomb properties based on player position and the given id
    this.height = baseSquare;
    this.width = baseSquare;
    this.xCoord = playerPosition.x;
    this.yCoord = playerPosition.y;
    this.className = "bomb";
    this.id = `bomb${id}`;
    this.idOnCenter = 0;
    this.timeOutId = undefined;
    this.started = undefined;
    this.elapsed = 0;
  }

  // Generates the bomb's HTML element and adds it to the field
  generateHTMLElement(cont) {
    const div = framework.createElement('div', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`,
        left: `${this.xCoord}px`,
        top: `${this.yCoord}px`,
      },
      class: this.className,
      id: this.id
    });

    framework.appendChildren(cont.querySelector(".field"), div)
  }
  // Removes the bomb's HTML element from the DOM
  removeHTMLElement(cont) {
    const bombElement = cont.querySelector(`#${this.id}`);
    if (bombElement) {
      bombElement.remove();
    }
  }
}
