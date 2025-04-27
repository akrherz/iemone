import { updateRadarTMSLayer } from './radarTMSLayer';
import { getCurrentTime, setCurrentTime, getIsRealTime, setIsRealTime, subscribeToCurrentTime, subscribeToRealTime } from './stateManager';

let timeInput = null;
let animationInterval = null;

function handleTimeInputChange(event) {
    if (!timeInput) return;
    setCurrentTime(new Date(event.target.value));
    updateRadarTMSLayer(getCurrentTime());
}

function toggleAnimation() {
    let progressBar = document.querySelector('#animation-progress .progress');
    const timePlayPauseButton = document.getElementById('time-play-pause');

    if (!progressBar) {
        const progressContainer = document.getElementById('animation-progress');
        progressBar = document.createElement('div');
        progressBar.className = 'progress';
        progressContainer.appendChild(progressBar);
    }

    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        if (timePlayPauseButton) {
            timePlayPauseButton.textContent = '▶';
        }
        progressBar.style.width = '0%';
        return;
    }

    let currentTime = getCurrentTime();
    let now = new Date(currentTime);
    now.setMinutes(currentTime.getMinutes() - 55);
    let step = 0;
    const totalSteps = 12;

    animationInterval = setInterval(() => {
        if (step >= totalSteps) {
            step = 0;
            now = new Date(currentTime.getTime() - 55 * 60 * 1000);
        }
        updateRadarTMSLayer(now);
        now.setMinutes(now.getMinutes() + 5);
        step++;
        const progressPercentage = (step / totalSteps) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }, 1000);

    if (timePlayPauseButton) {
        timePlayPauseButton.textContent = '⏸';
    }
}

export function setupTimeInputControl() {
    timeInput = document.getElementById('current-time');
    
    // Subscribe to both time and realtime mode changes
    subscribeToCurrentTime((currentTime) => {
        updateTimeInput(currentTime);
    });
    
    subscribeToRealTime((isRealtime) => {
        updateUI(isRealtime);
    });

    timeInput.addEventListener('change', handleTimeInputChange);

    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timePlayPauseButton = document.getElementById('time-play-pause');
    const timeStepForwardButton = document.getElementById('time-step-forward');
    const realtimeModeButton = document.getElementById('realtime-mode');

    timeStepBackwardButton.addEventListener('click', () => stepTime(-5));
    timeStepForwardButton.addEventListener('click', () => stepTime(5));
    timePlayPauseButton.addEventListener('click', toggleAnimation);
    realtimeModeButton.addEventListener('click', () => setIsRealTime(true));
}

function updateTimeInput(time) {
    if (timeInput) {
        const year = time.getFullYear();
        const month = (time.getMonth() + 1).toString().padStart(2, '0');
        const day = time.getDate().toString().padStart(2, '0');
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

function stepTime(minutes) {
    const currentTime = getCurrentTime();
    const newTime = new Date(currentTime);
    newTime.setMinutes(currentTime.getMinutes() + minutes);
    setCurrentTime(newTime);
    updateRadarTMSLayer(newTime);
}

function updateUI(isRealtime) {
    const realtimeModeButton = document.getElementById('realtime-mode');
    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timeStepForwardButton = document.getElementById('time-step-forward');
    const timePlayPauseButton = document.getElementById('time-play-pause');

    if (!isRealtime) {
        realtimeModeButton.textContent = '⏱';
        realtimeModeButton.title = 'Enable Real-Time Mode';

        timeInput.disabled = false;
        timeInput.title = '';
        timeStepBackwardButton.disabled = false;
        timeStepBackwardButton.title = '';
        timeStepForwardButton.disabled = false;
        timeStepForwardButton.title = '';
    } else {
        realtimeModeButton.textContent = '🔴';
        realtimeModeButton.title = 'Disable Real-Time Mode';

        timeInput.disabled = true;
        timeInput.title = 'Disabled in Real-Time Mode';
        timeStepBackwardButton.disabled = true;
        timeStepBackwardButton.title = 'Disabled in Real-Time Mode';
        timeStepForwardButton.disabled = true;
        timeStepForwardButton.title = 'Disabled in Real-Time Mode';
    }
}
