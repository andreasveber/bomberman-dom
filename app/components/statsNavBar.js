import { store } from "../store.js";
import { Framework } from "../framework.js";

const framework = new Framework();

export const saveStatsInStore = () => {
    const containerStats = document.querySelector('.container-stats');

    if (!containerStats) {
        console.error("Container for stats not found.");
        return;
    }
    const lives = containerStats.querySelector('#span__lives')?.textContent || '0';
    const players = containerStats.querySelector('#span__players')?.textContent || '0';
    const timer = containerStats.querySelector('#span__timer')?.textContent || '0:00';

    store.setStats({
        lives: parseInt(lives, 10),
        players: parseInt(players, 10),
        timer: timer
    });
};

export const newStats = (stats, user) => {
    const new_stats = framework.createElement('div', { class: 'navbar_stats flex space-x-4' });
    Array.from(stats.children).forEach(child => {
        const clone = child.cloneNode(true);
        clone.id = 'nav_' + child.id;
        framework.appendChildren(new_stats, clone);
    });
    const log_user = framework.createElement('div', { id: 'logged_user' }, [`${user?.nickname} logged in`])
    framework.appendChildren(new_stats, log_user);
    stats.style.display = 'none';
    store.subscribe(() => {
        const stats = store.state.stats;

        const livesElement = document.querySelector('#span__lives');
        const playersElement = document.querySelector('#span__players');
        const timerElement = document.querySelector('#span__timer');

        if (livesElement) livesElement.textContent = stats.lives;
        if (playersElement) playersElement.textContent = stats.players;
        if (timerElement) timerElement.textContent = stats.timer;
    });
    return new_stats
}