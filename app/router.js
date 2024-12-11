import { renderAuth } from './components/Auth.js';
import { renderHome } from './components/Home.js';
import { renderGame } from './components/GameNchat.js';
import { renderNavbar } from './components/Navbar.js';

class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentRoute = window.location.pathname;

    // Bind render to the popstate event for back/forward navigation
    window.addEventListener('popstate', () => {
      this.currentRoute = window.location.pathname;
      this.render();
    });
  }
  navigate(path) {
    this.currentRoute = path;
    window.history.pushState({}, '', path);
    this.render();
    renderNavbar();
  }

  render() {
    const route = this.routes[this.currentRoute] || this.routes['/'];
    route();
    renderNavbar();
  }
}

export const router = new Router({
  '/': renderHome,
  '/login': renderAuth,
  '/register': renderAuth,
  '/game': renderGame
});



