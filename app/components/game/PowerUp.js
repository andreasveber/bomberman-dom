import { GameContext } from "./Context";

export class PowerUp {
    constructor(type, position, id = Date.now()) {
        this.id = id;
        this.type = type;  // 'speed', 'bombRange', 'extraBomb'
        this.x = position.x;
        this.y = position.y;
        this.width = 60;  // Same as baseSquare
        this.height = 60;
        this.className = "power-up";
        this.collected = false;
    }

    apply(player) {
        const effect = {
            speed: { value: 0.5, max: 4, message: 'Speed up!' },
            bombRange: { value: 1, max: 5, message: 'Bomb range increased!' },
            extraBomb: { value: 1, max: 5, message: 'Extra bomb!' }
        }[this.type];

        switch(this.type) {
            case 'speed':
                player.speed = Math.min(player.speed + effect.value, effect.max);
                break;
            case 'bombRange':
                player.bombLength = Math.min(player.bombLength + effect.value, effect.max);
                break;
            case 'extraBomb':
                player.maxBombs = Math.min(player.maxBombs + effect.value, effect.max);
                break;
        }

        // Show feedback
        const feedback = document.createElement('div');
        feedback.textContent = effect.message;
        feedback.style.position = 'absolute';
        feedback.style.left = `${this.x}px`;
        feedback.style.top = `${this.y - 30}px`;
        feedback.style.color = 'white';
        feedback.style.fontSize = '16px';
        feedback.style.fontWeight = 'bold';
        feedback.style.textShadow = '2px 2px black';
        feedback.style.zIndex = '10';
        feedback.style.whiteSpace = 'nowrap';
        GameContext.container.querySelector(".field").appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 1000);
    }

    generateHTMLElement(container) {
        const div = document.createElement('div');
        div.className = `power-up ${this.type}`;
        div.style.left = `${this.x}px`;
        div.style.top = `${this.y}px`;
        div.dataset.id = this.id;
        container.querySelector(".field").appendChild(div);
    }
} 