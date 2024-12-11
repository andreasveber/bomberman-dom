import '../../../public/styles.css'
import { Framework } from "../../framework";

const framework = new Framework();

export function createGameUI() {

    const gameWrapper = framework.createElement('div', { class: 'game-wrapper' });
    const pauseScreen = framework.createElement('div', { class: 'pause-screen active' });
    const instructions = framework.createElement('div', { class: 'instructions' });
    const timers = framework.createElement('div', { id: 'timers' });
    const waitTimer = framework.createElement('div', { id: 'waiting_timer' }, ['Waiting timer: ']);
    const prepTimer = framework.createElement('div', { id: 'prep-timer' }, ['Preparation timer: '])
    const spanWait = framework.createElement('span', { id: 'wait-time' }, ['--']);
    const spanPrep = framework.createElement('span', { id: 'prep-time' }, ['--'])
    framework.appendChildren(waitTimer, spanWait);
    framework.appendChildren(prepTimer, spanPrep);
    framework.appendChildren(timers, [waitTimer, prepTimer]);


    const startSpan = framework.createElement('span', { id: 'start' }, ['Waiting for other player(s) to join...']);

    const pauseSpan = framework.createElement('span', { id: 'pause' }, ['Press Esc to pause.']);

    const bombSpan = framework.createElement('span', { id: 'bomb' }, ['Press Space to drop a bomb.']);
    framework.appendChildren(instructions, [startSpan, pauseSpan, bombSpan])

    const infoSpan = framework.createElement('span', { id: 'info' }, [`let's start!`]);
    framework.appendChildren(pauseScreen, [instructions, timers, infoSpan])

    const field = framework.createElement('div', { class: 'field' });
    framework.appendChildren(gameWrapper, [pauseScreen, field])

    return gameWrapper;
}