import { Framework } from '../framework.js';
import { renderNavbar } from './Navbar.js';
const framework = new Framework();

export function renderHome() {

    renderNavbar();

    const title = framework.createElement('h1', { class: 'text-3xl font-bold text-center mb-4' }, 'Welcome to Bomberman!');
    const description = framework.createElement('p', { class: 'text-center text-gray-600 mb-6' }, 'Navigate to the game - play and chat with others.');

    const box = framework.createElement('div', { class: 'max-w-md mx-auto bg-white p-6 rounded shadow-md space-y-4' }, [
        title,
        description,
    ]);

    framework.updateDOM(box, document.getElementById('app'));
}






