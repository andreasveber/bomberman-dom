import { baseSquaresX } from "./bombardment";
import { GameContext } from "./Context";

export const baseSquare = 60;

const wallCollision = (container, character) => {

  if (
    character?.idOnLeftTop === character?.idOnRightTop &&
    character?.idOnLeftTop === character?.idOnLeftBottom &&
    character?.idOnLeftTop === character?.idOnRightBottom
  ) {
    if (!container.querySelector("#box" + (character?.idOnLeftTop + 1))?.classList.contains("box__unbreakable") &&
      !container.querySelector("#box" + (character?.idOnLeftTop + 1))?.classList.contains("box__breakable")) {
      character.rightBlock = false;
    }
    if (!container.querySelector("#box" + (character?.idOnLeftTop - 1))?.classList.contains("box__unbreakable") &&
      !container.querySelector("#box" + (character?.idOnLeftTop - 1))?.classList.contains("box__breakable")) {
      character.leftBlock = false;
    }
    if (!container.querySelector("#box" + (character?.idOnLeftTop + 10))?.classList.contains("box__unbreakable") &&
      !container.querySelector("#box" + (character?.idOnLeftTop + 10))?.classList.contains("box__breakable")) {
      character.downBlock = false;
    }
    if (!container.querySelector("#box" + (character?.idOnLeftTop - 10))?.classList.contains("box__unbreakable") &&
      !container.querySelector("#box" + (character?.idOnLeftTop - 10))?.classList.contains("box__breakable")) {
      character.upBlock = false;
    }
  }

  if (character?.idOnLeftTop === character?.idOnRightTop) {
    if (container.querySelector("#box" + (character?.idOnLeftTop + 1))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnLeftTop + 1))?.classList.contains("box__breakable")) {
      character.rightBlock = true;
    }
    if (container.querySelector("#box" + (character?.idOnLeftTop - 1))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnLeftTop - 1))?.classList.contains("box__breakable")) {
      character.leftBlock = true;
    }
  }
  if (character?.idOnLeftBottom === character?.idOnRightBottom) {
    if (container.querySelector("#box" + (character?.idOnLeftBottom + 1))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnLeftBottom + 1))?.classList.contains("box__breakable")) {
      character.rightBlock = true;
    }
    if (container.querySelector("#box" + (character?.idOnLeftBottom - 1))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnLeftBottom - 1))?.classList.contains("box__breakable")) {
      character.leftBlock = true;
    }
  }
  if (character?.idOnLeftTop === character?.idOnLeftBottom) {
    if (container.querySelector("#box" + (character?.idOnLeftTop + 10))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnLeftTop + 10))?.classList.contains("box__breakable")) {
      character.downBlock = true;
    }
    if (container.querySelector("#box" + (character?.idOnLeftTop - 10))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnLeftTop - 10))?.classList.contains("box__breakable")) {
      character.upBlock = true;
    }
  }
  if (character?.idOnRightTop === character?.idOnRightBottom) {
    if (container.querySelector("#box" + (character?.idOnRightTop + 10))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnRightTop + 10))?.classList.contains("box__breakable")) {
      character.downBlock = true;
    }
    if (container.querySelector("#box" + (character?.idOnRightTop - 10))?.classList.contains("box__unbreakable") ||
      container.querySelector("#box" + (character?.idOnRightTop - 10))?.classList.contains("box__breakable")) {
      character.upBlock = true;
    }
  }
};

const setDivCorners = (character) => {

  character.idOnLeftTop = ((((1 + Math.floor((character.y - GameContext.topLimit) / baseSquare)) - 1) * baseSquaresX) + (1 + (Math.floor((character.x - GameContext.leftLimit) / baseSquare))));
  character.idOnLeftBottom = ((((Math.ceil((character.y - GameContext.topLimit + character.height) / baseSquare)) - 1) * baseSquaresX) + (1 + (Math.floor((character.x - GameContext.leftLimit) / baseSquare))));
  character.idOnRightTop = ((((1 + Math.floor((character.y - GameContext.topLimit) / baseSquare)) - 1) * baseSquaresX) + ((Math.ceil((character.x - GameContext.leftLimit + character.width) / baseSquare))));
  character.idOnRightBottom = ((((Math.ceil((character.y - GameContext.topLimit + character.height) / baseSquare)) - 1) * baseSquaresX) + ((Math.ceil((character.x - GameContext.leftLimit + character.width) / baseSquare))));

  character.idOnCenter = ((((Math.ceil((character.y - GameContext.topLimit + (character.height / 2)) / baseSquare)) - 1) * baseSquaresX) + ((Math.ceil((character.x - GameContext.leftLimit + (character.width / 2)) / baseSquare))))

  character.centerX = character.x + (character.width / 2)
  character.centerY = character.y + (character.height / 2)
}

export const movePlayer = (container, player) => {

  if (GameContext.held_directions[0]) {
    setDivCorners(player);

    if (GameContext.held_directions[0] === GameContext.directions.right) {
      wallCollision(container, player);
      animate("180px", GameContext.bomberman, GameContext.frameCount, player)
      if (!player.rightBlock) {
        player.x += player.speed;
        player.leftBlock = false;
        player.downBlock = false;
        player.upBlock = false;
      }
    }
    if (GameContext.held_directions[0] === GameContext.directions.left) {
      wallCollision(container, player);
      animate("60px", GameContext.bomberman, GameContext.frameCount, player)
      if (!player.leftBlock) {
        player.x -= player.speed;
        player.rightBlock = false;
        player.downBlock = false;
        player.upBlock = false;
      }
    }
    if (GameContext.held_directions[0] === GameContext.directions.down) {
      wallCollision(container, player);
      animate("120px", GameContext.bomberman, GameContext.frameCount, player)
      if (!player.downBlock) {
        player.y += player.speed;
        player.rightBlock = false;
        player.leftBlock = false;
        player.upBlock = false;
      }
    }
    if (GameContext.held_directions[0] === GameContext.directions.up) {
      wallCollision(container, player);
      animate("0px", GameContext.bomberman, GameContext.frameCount, player)
      if (!player.upBlock) {
        player.y -= player.speed;
        player.rightBlock = false;
        player.leftBlock = false;
        player.downBlock = false;
      }
    }
  }

  if (GameContext.held_directions[1]) {
    setDivCorners(player);
    if (GameContext.held_directions[1] === GameContext.directions.right) {
      wallCollision(container, player);
      if (!player.rightBlock) {
        player.x += player.speed;
        player.leftBlock = false;
        player.downBlock = false;
        player.upBlock = false;
      }
    }
    if (GameContext.held_directions[1] === GameContext.directions.left) {
      wallCollision(container, player);
      if (!player.leftBlock) {
        player.x -= player.speed;
        player.rightBlock = false;
        player.downBlock = false;
        player.upBlock = false;
      }
    }
    if (GameContext.held_directions[1] === GameContext.directions.down) {
      wallCollision(container, player);
      if (!player.downBlock) {
        player.y += player.speed;
        player.rightBlock = false;
        player.leftBlock = false;
        player.upBlock = false;
      }
    }
    if (GameContext.held_directions[1] === GameContext.directions.up) {
      wallCollision(container, player);
      if (!player.upBlock) {
        player.y -= player.speed;
        player.rightBlock = false;
        player.leftBlock = false;
        player.downBlock = false;
      }
    }
  }
  if (player.x < GameContext.leftLimit) {
    player.x = GameContext.leftLimit;
  }
  if (player.x > GameContext.rightLimit) {
    player.x = GameContext.rightLimit;
  }
  if (player.y < GameContext.topLimit) {
    player.y = GameContext.topLimit;
  }
  if (player.y > GameContext.bottomLimit) {
    player.y = GameContext.bottomLimit;
  }
  GameContext.bomberman.style.transform = `translate3d(${player.x}px, ${player.y}px, 0)`;

  // Broadcast position if this is the local player
  if (player.isLocal && GameContext.ws && GameContext.ws.readyState === WebSocket.OPEN) {
    GameContext.ws.send(JSON.stringify({
      type: 'player_moved',
      payload: {
        playerId: player.id,
        x: player.x,
        y: player.y,
        spritePos: player.spritePos,
        direction: GameContext.held_directions[0]
      }
    }));
  }
};
const animate = (posY, div, frameCount, character) => {

  if (frameCount % 5 === 0) {
    div.style.backgroundPosition = character.spritePos * baseSquare + "px " + posY;
    character.spritePos++
    if (character.spritePos === character.spriteLength) {
      character.spritePos = 0
    }
  }
}

export const checkPowerUpCollision = (container, player) => {
    GameContext.powerUps = GameContext.powerUps.filter(powerUp => {
        const powerUpElement = container.querySelector(`.power-up[data-id="${powerUp.id}"]`);
        if (!powerUpElement) return false;

        const playerRect = GameContext.bomberman.getBoundingClientRect();
        const powerUpRect = powerUpElement.getBoundingClientRect();
        const collisionBuffer = Math.max(4, player.speed / 2);

        if (playerRect.left < powerUpRect.right + collisionBuffer &&
            playerRect.right > powerUpRect.left - collisionBuffer &&
            playerRect.top < powerUpRect.bottom + collisionBuffer &&
            playerRect.bottom > powerUpRect.top - collisionBuffer) {
            
            powerUp.apply(player);
            powerUp.collected = true;
            powerUpElement.remove();

            if (GameContext.ws?.readyState === WebSocket.OPEN) {
                const payload = {
                    playerId: player.id,
                    powerUpId: powerUp.id,
                    powerUpType: powerUp.type
                };
                GameContext.ws.send(JSON.stringify({
                    type: 'powerup_collected',
                    payload: payload
                }));
            }
            return false;
        }
        return true;
    });
};