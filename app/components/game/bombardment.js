import { GameContext } from "./Context";
import { PowerUp } from './PowerUp';

export const baseSquaresX = 10
// Function to handle the explosion at a given square
const boom = (square) => {
  const squareElement = GameContext.container.querySelector("#box" + square);
  const boomElement = GameContext.container.querySelector("#boom" + square);

  // Check all players for hits
  for (const [_, player] of GameContext.players) {
    const playerDiv = GameContext.container.getElementsByClassName(player.className)[0];
    if (!playerDiv) continue;

    const playerRect = playerDiv.getBoundingClientRect();
    const squareRect = squareElement.getBoundingClientRect();

    // Calculate center points
    const playerCenter = {
      x: (playerRect.left + playerRect.right) / 2,
      y: (playerRect.top + playerRect.bottom) / 2
    };

    const squareCenter = {
      x: (squareRect.left + squareRect.right) / 2,
      y: (squareRect.top + squareRect.bottom) / 2
    };

    // Check distance between centers
    const distance = Math.sqrt(
      Math.pow(playerCenter.x - squareCenter.x, 2) +
      Math.pow(playerCenter.y - squareCenter.y, 2)
    );

    // If distance is less than half the square size plus some buffer
    if (distance < squareRect.width * 0.7) {
      if (player.isLocal) {
        playerHit(GameContext.container, player);
      }
    }
  }

  if (GameContext.player.bombArray.length > 1) {
    GameContext.player.bombArray.slice(1).forEach(bomb => {
      if (bomb?.idOnCenter === square) {
        clearTimeout(bomb.timeOutId);
        setExplodeWave(GameContext.container, bomb, 0);
      }
    });
  }

  if (squareElement?.classList.contains("box__breakable")) {
    squareElement.classList.remove("box__breakable");
    squareElement.classList.add("box__hidden");

    // Check if we should spawn a power-up
    if (shouldSpawnPowerUp()) {
      const powerUpType = getRandomPowerUpType();
      const position = {
        x: squareElement.offsetLeft,
        y: squareElement.offsetTop
      };
      const powerUpId = Date.now();

      // Create and spawn power-up locally
      const powerUp = new PowerUp(powerUpType, position, powerUpId);
      powerUp.generateHTMLElement(GameContext.container);
      GameContext.powerUps.push(powerUp);

      // Broadcast power-up spawn
      if (GameContext.ws && GameContext.ws.readyState === WebSocket.OPEN) {
        GameContext.ws.send(JSON.stringify({
          type: 'powerup_spawned',
          payload: {
            id: powerUpId,
            type: powerUpType,
            position: position
          }
        }));
      }
    }

    // Broadcast field update when box is destroyed
    if (GameContext.ws && GameContext.ws.readyState === WebSocket.OPEN) {
      GameContext.ws.send(JSON.stringify({
        type: 'field_update',
        payload: {
          squareId: square,
          newState: 'hidden'
        }
      }, null, 0));

    }
  }

  if (boomElement) {
    boomElement.style.visibility = "visible";
    setTimeout(() => {
      boomElement.style.visibility = "hidden";
    }, 300);
  }
};
// Function to check if there is a bomb in a given square
export const bombInSquare = (square, bombArray) => {
  return bombArray.some(bomb => bomb.idOnCenter === square);

};
// Function to set the explosion wave timeout for a bomb
export const setExplodeWave = (timer, bomb) => {
  bomb.timeOutId = setTimeout(() => {
    explodeWave(GameContext.container, bomb);

    if (GameContext.player.isLocal && GameContext.ws && GameContext.ws.readyState === WebSocket.OPEN) {
      GameContext.ws.send(JSON.stringify({
        type: 'bomb_exploded',
        payload: {
          bombId: bomb.id,
          playerId: GameContext.player.id,
          idOnCenter: bomb.idOnCenter
        }
      }));
    }
  }, timer);
};

export const pauseBomb = (bomb) => {
  clearInterval(bomb.timeOutId);
  bomb.elapsed = Date.now() - bomb.started;
};

export const restartBomb = (bomb) => {
  setExplodeWave(GameContext.player.bombTimer - bomb.elapsed, bomb);
};

// Function to trigger the explosion wave from a bomb's center
export const explodeWave = (container, bomb) => {
  // Find bomb owner more efficiently
  const bombOwner = Array.from(GameContext.players.values())
    .find(player => player.bombArray.some(b => b.id === bomb.id));

  if (!bombOwner) return;
  bombOwner.activeBombs--;

  // Center explosion
  boom(bomb.idOnCenter);

  // Up
  for (let i = 1; i <= bombOwner.bombLength; i++) {
    const square = bomb.idOnCenter - baseSquaresX * i;
    if (!processExplosionSquare(container, square)) break;
  }

  // Left
  for (let i = 1; i <= bombOwner.bombLength; i++) {
    if ((bomb.idOnCenter - i) % baseSquaresX === 0) break;
    const square = bomb.idOnCenter - i;
    if (!processExplosionSquare(container, square)) break;
  }

  // Right
  for (let i = 1; i <= bombOwner.bombLength; i++) {
    if ((bomb.idOnCenter + i) % baseSquaresX === 1) break;
    const square = bomb.idOnCenter + i;
    if (!processExplosionSquare(container, square)) break;
  }

  // Down
  for (let i = 1; i <= bombOwner.bombLength; i++) {
    const square = bomb.idOnCenter + baseSquaresX * i;
    if (!processExplosionSquare(container, square)) break;
  }

  // Remove the bomb from its owner's array and HTML
  const bombIndex = bombOwner.bombArray.findIndex(b => b.id === bomb.id);
  if (bombIndex !== -1) {
    bombOwner.bombArray.splice(bombIndex, 1);
  }
  bomb?.removeHTMLElement(container);
};

// Helper function to process explosion in a square
const processExplosionSquare = (container, square) => {
  const squareElement = container.querySelector("#box" + square);
  if (!squareElement?.classList.contains("box__hidden") &&
    !squareElement?.classList.contains("box__breakable")) {
    return false;
  }
  boom(square);
  return !squareElement?.classList.contains("box__breakable");
};

// Function to handle player hit by a bomb explosion
const playerHit = (container, player) => {
  if (player.invulnerable === false) {
    player.invulnerable = true;
    player.lives--;

    // Get the specific player's element using their ID
    let playerDiv = container.querySelector(`#player-${player.id}`);
    if (!playerDiv) return;

    // Start blinking animation
    let onOff = true;
    let blinker = setInterval(() => {
      playerDiv.style.opacity = onOff ? "0" : "1";
      onOff = !onOff;
    }, 200);

    setTimeout(() => {
      clearInterval(blinker);
      playerDiv.style.opacity = "1";
      player.invulnerable = false;
    }, 1200);

    // Only broadcast if this is the local player getting hit
    if (player.isLocal && GameContext.ws?.readyState === WebSocket.OPEN) {
      GameContext.ws.send(JSON.stringify({
        type: 'player_hit',
        payload: {
          playerId: player.id,
          lives: player.lives
        }
      }));
    }
  }
}

const shouldSpawnPowerUp = () => Math.random() < 0.3; // 30% chance

const getRandomPowerUpType = () => {
  const types = ['speed', 'bombRange', 'extraBomb'];
  return types[Math.floor(Math.random() * types.length)];
};
