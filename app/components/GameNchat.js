import { ChatForm } from './ChatForm.js';
import { Framework } from '../framework.js';
import { InitGame } from './game/bomberman.js';

const framework = new Framework();

export const renderGame = () => {
    // Create chat form container
    const chatFormContainer = ChatForm();

    // Create game container
    const field = framework.createElement('div', { id: 'game-container', class: 'game_container flex-grow' });

    InitGame(field);

    // Combine game and chat containers into gameNchat
    const gameNchat = framework.createElement(
        'div',
        { class: 'gameNchat flex' },
        [field, chatFormContainer]
    );

    // Render the combined container to the root
    const root = document.getElementById('app');
    framework.updateDOM(gameNchat, root);
};
