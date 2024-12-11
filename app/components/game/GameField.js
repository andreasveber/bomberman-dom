import { baseSquare } from "./movement";
import { Framework } from "../../framework";

const framework = new Framework();

export class GameField {

  constructor(height = 10, width = 10) {
    if (!GameField.instance) {
      this.height = height;
      this.width = width;
      this.boxList = [];
      this.spawnPoints = [];
      this.fixedBoxes = [];
      this.spawnCount = 100;
      this.className = "gamefield";
      GameField.instance = this;
    }
    return GameField.instance
  }
  generateHTMLElement(cont) {
    const div = framework.createElement('div', {
      style: {
        height: `${this.height * baseSquare}px`,
        width: `${this.width * baseSquare}px`
      },
      class: this.className
    });

    const wrapper = framework.createElement('div', { class: 'container-stats' });
    const lives = framework.createElement('div', { id: 'lives' }, ['Lives left: ']);
    const spanLives = framework.createElement('span', { id: 'span__lives' }, ['3']);
    framework.appendChildren(lives, spanLives)

    const players = framework.createElement('div', { id: 'score' }, ['Players: ']);
    const spanPlayers = framework.createElement('span', { id: 'span__players' }, ['0']);
    framework.appendChildren(players, spanPlayers)

    const timer = framework.createElement('div', { id: 'timer' }, ['Time left: ']);
    const spanTimer = framework.createElement('span', { id: 'span__timer' }, ['2:00']);
    framework.appendChildren(timer, spanTimer)

    framework.appendChildren(wrapper, [lives, players, timer]);

    framework.appendChildren(cont.querySelector(".field"), [wrapper, div]);
  }

}