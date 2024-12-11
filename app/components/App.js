import { router } from '../router.js';
import { Framework } from '../framework.js';
import { renderAuth } from './Auth.js';
import { renderHome } from './Home.js';
import { renderGame } from './GameNchat.js';

const framework = new Framework();

export function App() {

    const renderPage = () => {

        const currentRoute = router.currentRoute;
        const root = document.getElementById('app');

        if (currentRoute === '/login' || currentRoute === '/register') {
            framework.updateDOM(renderAuth(), root);
        } else if (currentRoute === '/game') {
            framework.updateDOM(renderGame(), root);
        } else {
            framework.updateDOM(renderHome(), root);
        }
    };
    // Initial render
    renderPage();
}