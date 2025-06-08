import { updateRadarTMSLayer, resetRadarTMSLayer } from './radarTMSLayer';
import { saveState, getCurrentTime, setCurrentTime, setIsRealTime, getIsRealTime, subscribeToCurrentTime, subscribeToRealTime } from './state';
import { updateAnimationBranding, updateBrandingOverlay } from './brandingOverlay';
import strftime from 'strftime';
import { requireElement, requireButtonElement, requireInputElement } from 'iemjs/domUtils';

let timeInput = null;
let animationInterval = null;

function handleTimeInputChange(event) {
    if (!timeInput) {
        return;
    }
    setCurrentTime(new Date(event.target.value));
    updateRadarTMSLayer(getCurrentTime());
}

function toggleAnimation() {
    let progressBar = document.querySelector('#animation-progress .progress');
    const timePlayPauseButton = requireElement('time-play-pause');

    if (!progressBar) {
        const progressContainer = requireElement('animation-progress');
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
        if (progressBar instanceof HTMLElement) {
            progressBar.style.width = '0%';
        }
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
        if (progressBar instanceof HTMLElement) {
            progressBar.style.width = `${progressPercentage}%`;
        }
    }, 1000);

    if (timePlayPauseButton) {
        timePlayPauseButton.textContent = '⏸︎';
    }
}

export function setupTimeInputControl() {
    timeInput = requireElement('current-time');
    
    subscribeToCurrentTime((currentTime) => {
        updateTimeInput(currentTime);
    });
    
    subscribeToRealTime((isRealtime) => {
        updateUI(isRealtime);
        // Update the radio buttons
        requireInputElement('realtime-mode').checked = isRealtime;
        requireInputElement('archive-mode').checked = !isRealtime;
        // Update branding overlay
        const brandingOverlay = requireElement('branding-overlay');
        brandingOverlay.textContent = `IEM1: ${isRealtime ? 'Real-time' : 'Archive'}`;
        brandingOverlay.dataset.mode = isRealtime ? 'realtime' : 'archive';
    });

    timeInput.addEventListener('change', handleTimeInputChange);

    const timeStepBackwardButton = requireButtonElement('time-step-backward');
    const timePlayPauseButton = requireButtonElement('time-play-pause');
    const timeStepForwardButton = requireButtonElement('time-step-forward');

    // Set up radio button event listeners
    const realtimeMode = requireInputElement('realtime-mode');
    const archiveMode = requireInputElement('archive-mode');
    const isRealtime = getIsRealTime();

    realtimeMode.checked = isRealtime;
    archiveMode.checked = !isRealtime;

    realtimeMode.addEventListener('change', (e) => {
        const target = e.target;
        if (target instanceof HTMLInputElement) {
            setIsRealTime(target.checked);
        }
        saveState();
    });
    archiveMode.addEventListener('change', (e) => {
        const target = e.target;
        if (target instanceof HTMLInputElement) {
            setIsRealTime(!target.checked);
        }
        saveState();
    });

    timeStepBackwardButton.addEventListener('click', () => stepTime(-5));
    timeStepForwardButton.addEventListener('click', () => stepTime(5));
    timePlayPauseButton.addEventListener('click', toggleAnimation);


}

function updateTimeInput(time) {
    if (timeInput) {
        timeInput.value = strftime('%Y-%m-%dT%H:%M', time);
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
    const timeStepBackwardButton = requireButtonElement('time-step-backward');
    const timeStepForwardButton = requireButtonElement('time-step-forward');
    const timePlayPauseButton = requireButtonElement('time-play-pause');

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
