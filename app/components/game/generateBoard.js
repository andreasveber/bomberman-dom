import { Box } from "./Box";
import { createGameUI } from "./Container";
import { Framework } from "../../framework";
import { GameContext } from "./Context";

const framework = new Framework();

export const generateBoard = async (container, gameField, player) => {

  framework.appendChildren(container, createGameUI());
  gameField.generateHTMLElement(container);

  // Coordinates of spawn points - all corners three boxes
  GameContext.gameField.spawnPoints = [
    [1, 1], [1, 2], [1, 9], [1, 10], [2, 1], [2, 10],
    [9, 1], [9, 10], [10, 1], [10, 2], [10, 10], [10, 9],
  ];
  GameContext.gameField.fixedBoxes = [
    [2, 2], [2, 4], [2, 6], [2, 8], [4, 3], [4, 5], [4, 7], [4, 9], [6, 2], [6, 4], [6, 6], [6, 8], [8, 3], [8, 5], [8, 7], [8, 9], [10, 3], [10, 5], [10, 7]
  ]
  const isSpecialCell = (i, j) => GameContext.gameField.spawnPoints.some(([x, y]) => x === i && y === j);
  const isFixedBox = (i, j) =>
    GameContext.gameField.fixedBoxes.some(([x, y]) => x === i && y === j);
  // Generate cells on the field
  for (let i = 1; i <= gameField.height; i++) {
    for (let j = 1; j <= gameField.width; j++) {
      let box;
      if (isSpecialCell(i, j)) {
        box = new Box(100);// Void boxes for spawn points
      } else if (isFixedBox(i, j)) {

        box = new Box(55); // Fixed unbreakable box
      } else {
        let random;
        do {
          random = Math.floor(Math.random() * 101);
        } while (random >= 50 && random <= 64);
        box = new Box(random);
      }
      gameField.boxList.push(box);
      box.generateHTMLElement(container, ((i - 1) * gameField.width + j), i, j);
    }
  }
};