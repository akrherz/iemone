import { updateRadarTMSLayer, resetRadarTMSLayer } from './radarTMSLayer';
import { saveState, getCurrentTime, setCurrentTime, setIsRealTime, getIsRealTime, subscribeToCurrentTime, subscribeToRealTime } from './state';
import { updateAnimationBranding, updateBrandingOverlay } from './brandingOverlay';

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
            timePlayPauseButton.textContent = '⏵︎';
        }
        progressBar.style.width = '0%';
        resetRadarTMSLayer(); // Reset radar to match app state
        updateBrandingOverlay(); // Reset branding to normal state
        return;
    }

    const currentTime = getCurrentTime();
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
        updateAnimationBranding(now);
        now.setMinutes(now.getMinutes() + 5);
        step++;
        const progressPercentage = (step / totalSteps) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }, 1000);

    if (timePlayPauseButton) {
        timePlayPauseButton.textContent = '⏸︎';
    }
}

export function setupTimeInputControl() {
    timeInput = document.getElementById('current-time');
    
    subscribeToCurrentTime((currentTime) => {
        updateTimeInput(currentTime);
    });
    
    subscribeToRealTime((isRealtime) => {
        updateUI(isRealtime);
        // Update the radio buttons
        document.getElementById('realtime-mode').checked = isRealtime;
        document.getElementById('archive-mode').checked = !isRealtime;
        // Update branding overlay
        const brandingOverlay = document.getElementById('branding-overlay');
        if (brandingOverlay) {
            brandingOverlay.textContent = `IEM1: ${isRealtime ? 'Real-time' : 'Archive'}`;
            brandingOverlay.dataset.mode = isRealtime ? 'realtime' : 'archive';
        }
    });

    timeInput.addEventListener('change', handleTimeInputChange);

    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timePlayPauseButton = document.getElementById('time-play-pause');
    const timeStepForwardButton = document.getElementById('time-step-forward');

    // Set up radio button event listeners
    const realtimeMode = document.getElementById('realtime-mode');
    const archiveMode = document.getElementById('archive-mode');
    const isRealtime = getIsRealTime();

    realtimeMode.checked = isRealtime;
    archiveMode.checked = !isRealtime;

    realtimeMode.addEventListener('change', (e) => {
        setIsRealTime(e.target.checked);
        saveState();
    });
    archiveMode.addEventListener('change', (e) => {
        setIsRealTime(!e.target.checked);
        saveState();
    });

    timeStepBackwardButton.addEventListener('click', () => stepTime(-5));
    timeStepForwardButton.addEventListener('click', () => stepTime(5));
    timePlayPauseButton.addEventListener('click', toggleAnimation);


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
    saveState();
}

function updateUI(isRealtime) {
    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timeStepForwardButton = document.getElementById('time-step-forward');
    const timePlayPauseButton = document.getElementById('time-play-pause');

    if (!isRealtime) {
        timeInput.disabled = false;
        timeInput.title = '';
        timeStepBackwardButton.disabled = false;
        timeStepBackwardButton.title = '';
        timeStepForwardButton.disabled = false;
        timeStepForwardButton.title = '';
    } else {
        timeInput.disabled = true;
        timeInput.title = 'Disabled in Real-Time Mode';
        timeStepBackwardButton.disabled = true;
        timeStepBackwardButton.title = 'Disabled in Real-Time Mode';
        timeStepForwardButton.disabled = true;
        timeStepForwardButton.title = 'Disabled in Real-Time Mode';
    }
    // Animation button is always enabled
    timePlayPauseButton.disabled = false;
    timePlayPauseButton.title = '';
}
