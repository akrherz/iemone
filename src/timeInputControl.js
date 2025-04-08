import { updateRadarTMSLayer } from './radarTMSLayer';
import {
    getCurrentTime, subscribeToCurrentTime, setCurrentTime,
    subscribeToRealTime, getIsRealTime, setIsRealTime
} from './stateManager';
import { rectifyToFiveMinutes } from './utils';

let timeInput = null;
let animationInterval = null;
let realTimeInterval = null;

/**
 * Callback when the time input changes.
 * @param {*} event 
 */
function handleTimeInputChange(event) {
    const cb = timeInput.onchange;
    timeInput.onchange = null;
    setCurrentTime(new Date(event.target.value));
    timeInput.onchange = cb;
}

function toggleAnimation() {
    let progressBar = document.querySelector('#animation-progress .progress');

    if (!progressBar) {
        const progressContainer = document.getElementById('animation-progress');
        progressBar = document.createElement('div');
        progressBar.className = 'progress';
        progressContainer.appendChild(progressBar);
    }

    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        timePlayPauseButton.textContent = '⏯';
        progressBar.style.width = '0%';
        return;
    }

    const endTime = rectifyToFiveMinutes(getCurrentTime());
    const now = new Date();
    now.setMinutes(endTime.getMinutes() - 55);
    let step = 0;
    const totalSteps = 12;

    animationInterval = setInterval(() => {
        if (step >= totalSteps) {
            step = 0;
            now = new Date(endTime.getTime() - 55 * 60 * 1000);
        } else {
            now.setMinutes(now.getMinutes() + 5);
            updateRadarTMSLayer(now);
            step++;
        }

        const progressPercentage = (step / totalSteps) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }, 1000);

    timePlayPauseButton.textContent = '⏸';
}

export function setupTimeInputControl() {
    timeInput = document.getElementById('current-time');

    subscribeToCurrentTime((newTime) => {
        updateTimeInput(newTime);
    });
    subscribeToRealTime((isRealTime) => {
        updateUI();
    });

    timeInput.addEventListener('change', handleTimeInputChange);

    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timePlayPauseButton = document.getElementById('time-play-pause');
    const timeStepForwardButton = document.getElementById('time-step-forward');
    const realtimeModeButton = document.getElementById('realtime-mode');

    timeStepBackwardButton.addEventListener('click', () => stepTime(-5));
    timeStepForwardButton.addEventListener('click', () => stepTime(5));
    timePlayPauseButton.addEventListener('click', toggleAnimation);
    realtimeModeButton.addEventListener('click', toggleRealTimeMode);
}

function updateTimeInput(currentTime) {
    if (timeInput) {
        const year = currentTime.getFullYear();
        const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
        const day = currentTime.getDate().toString().padStart(2, '0');
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

function stepTime(minutes) {
    const currentTime = getCurrentTime();
    currentTime.setMinutes(currentTime.getMinutes() + minutes);
    setCurrentTime(currentTime);
}

function toggleRealTimeMode() {
    setIsRealTime(!getIsRealTime());
}

function updateUI() {
    const isRealTime = getIsRealTime();
    const realtimeModeButton = document.getElementById('realtime-mode');
    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timeStepForwardButton = document.getElementById('time-step-forward');
    const timePlayPauseButton = document.getElementById('time-play-pause');

    if (!isRealTime) {
        clearInterval(realTimeInterval);
        realTimeInterval = null;
        realtimeModeButton.textContent = '⏱';
        realtimeModeButton.title = 'Enable Real-Time Mode';

        timeInput.disabled = false;
        timeInput.title = '';
        timeStepBackwardButton.disabled = false;
        timeStepBackwardButton.title = '';
        timeStepForwardButton.disabled = false;
        timeStepForwardButton.title = '';
        return;
    }

    const now = new Date();
    setCurrentTime(now);

    realTimeInterval = setInterval(() => {
        const lnow = new Date();
        setCurrentTime(lnow);
    }, 60000);

    realtimeModeButton.textContent = '🔴';
    realtimeModeButton.title = 'Disable Real-Time Mode';

    timeInput.disabled = true;
    timeInput.title = 'Disabled in Real-Time Mode';
    timeStepBackwardButton.disabled = true;
    timeStepBackwardButton.title = 'Disabled in Real-Time Mode';
    timeStepForwardButton.disabled = true;
    timeStepForwardButton.title = 'Disabled in Real-Time Mode';
}
