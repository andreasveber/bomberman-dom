let time_in_minutes = 2;
let timeinterval;
let time_left;
let paused = false;
let current_time;
let deadline;
let startTimer = false;
export let timeOver = false;

export const setPausedTrue = () => paused = true;
export const setPausedFalse = () => paused = false;

export const countdown = (container_game) => {
    if (!startTimer) {
        current_time = Date.parse(new Date());
        deadline = new Date(current_time + time_in_minutes * 60 * 1000);
        run_clock('span__timer', deadline);
        startTimer = true;
    } else if (paused) {
        pause_clock()
    } else if (!paused) {
        resume_clock()
    }

    function time_remaining(endtime) {
        let t = Date.parse(endtime) - Date.parse(new Date());
        let seconds = Math.floor((t / 1000) % 60);
        let minutes = Math.floor((t / 1000 / 60) % 60);
        let hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        let days = Math.floor(t / (1000 * 60 * 60 * 24));
        return { 'total': t, 'days': days, 'hours': hours, 'minutes': minutes, 'seconds': seconds };
    }

    function run_clock(id, endtime) {
        let clock = container_game.querySelector(`#${id}`);
        function update_clock() {

            let t = time_remaining(endtime);
            if (t.seconds < 10) {
                clock.textContent = t.minutes + ':0' + t.seconds;
            } else {
                clock.textContent = t.minutes + ':' + t.seconds;
            }
            if (t.total <= 0) {
                clearInterval(timeinterval);
                timeOver = true;
            }
        }
        update_clock();
        timeinterval = setInterval(update_clock, 1000);
    }

    function pause_clock() {
        paused = true;
        clearInterval(timeinterval);
        time_left = time_remaining(deadline).total;
    }

    function resume_clock() {
        paused = false;
        deadline = new Date(Date.parse(new Date()) + time_left);
        run_clock('span__timer', deadline);
    }
}
