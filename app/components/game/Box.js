import { baseSquare } from "./movement";
import { Framework } from "../../framework";

const framework = new Framework();

export class Box {
  constructor(breakable, height = baseSquare, width = baseSquare) {
    this.height = `${height}px`;
    this.width = `${width}px`;
    this.breakable = breakable;
    this.className = "box ";

    if (this.breakable >= 65) {
      this.className += "box__hidden";
    } else if (this.breakable >= 50) {
      this.className += "box__unbreakable";
    } else {
      this.className += "box__breakable";
    }
  }

  generateHTMLElement(game_container, id, i, j) {

    const div = framework.createElement('div', {
      style: {
        height: `${this.height}`,
        width: `${this.width}`
      },
      class: this.className,
      id: `box${id}`,// current box number
      'data-i': `${i}`,// rows
      'data-j': `${j}`,//columns
      'data-spot': `${id}`//consecutive number
    });

    framework.appendChildren(game_container.querySelector('.gamefield'), div)

    const img = framework.createElement('img', {
      src: '../assets/images/explosion.png',
      style: {
        visibility: 'hidden'
      },
      id: `boom${id}`
    });
    const block = game_container.querySelector(`#box${id}`);
    framework.appendChildren(block, img)
  }
}
