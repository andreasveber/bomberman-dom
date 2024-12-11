import { Framework } from '../framework.js';
import { router } from '../router.js';
import { store } from '../store.js';
import { handleLogout } from './Logout.js';
import { handleEvent } from '../events.js';
import { newStats } from './statsNavBar.js';

const framework = new Framework();

export function renderNavbar() {
    const stats = document.querySelector('.container-stats');
    const user = store.getUser();

    const leftLinks = user
        ? [
            framework.createElement('button', { id: 'homeButton', class: 'nav-link' }, getHomeLabel()),
            framework.createElement('button', { id: 'logoutButton', class: 'nav-link' }, 'Logout')
        ]
        : [
            framework.createElement('button', { id: 'loginButton', class: 'nav-link' }, 'Login'),
            framework.createElement('button', { id: 'registerButton', class: 'nav-link' }, 'Register')
        ];
    const centerContent = framework.createElement('div', { class: 'center-content flex space-x-4' }, stats && user ? [newStats(stats, user)] : '');
    const rightLinks = user ? [
        framework.createElement('button', { id: 'playButton', class: 'nav-link' }, getGameLabel())
    ] : [];

    const navbar = framework.createElement('nav', { class: 'navbar flex justify-between p-4 bg-gray-800 text-white' }, [
        framework.createElement('div', { class: 'left-links flex space-x-4' }, leftLinks),
        centerContent,
        framework.createElement('div', { class: 'right-links flex space-x-4' }, rightLinks)
    ]);
    framework.updateDOM(navbar, document.querySelector('#navbar'));
}

store.subscribe(renderNavbar);

// Handle navbar button events
handleEvent('navbar', '.navbar', 'click', (event) => {
    if (event.target.matches('#homeButton')) {
        router.navigate('/');
    } else if (event.target.matches('#logoutButton')) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('lastRoute');
        handleLogout();
    } else if (event.target.matches('#loginButton')) {
        router.navigate('/login');
    } else if (event.target.matches('#registerButton')) {
        router.navigate('/register');
    } else if (event.target.matches('#playButton')) {
        router.navigate('/game');
    }
});

const getHomeLabel = () => router.currentRoute === '/' || router.currentRoute === '/home' ? '' : 'Home';
const getGameLabel = () => router.currentRoute === '/game' ? '' : 'Enter Game';