import { initUserFromSession } from './components/AuthUser.js';
import { Framework } from './framework.js';
import { router } from './router.js';
import './styles.css';

// initializes user upload from the session in case of window reload
initUserFromSession();
// Get the root element
const root = document.getElementById('app');

// Initialize the framework and routing
const framework = new Framework();
router.render(); // Initial route render

// Listen for route changes with popstate
window.onpopstate = () => router.render();

