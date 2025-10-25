import { updateRadarTMSLayer, resetRadarTMSLayer } from './radarTMSLayer';
import { saveState, getCurrentTime, setCurrentTime, setIsRealTime, getIsRealTime, subscribeToCurrentTime, subscribeToRealTime } from './state';
import { updateAnimationBranding, updateBrandingOverlay } from './brandingOverlay';
import { requireElement, requireButtonElement, requireInputElement } from 'iemjs/domUtils';
import flatpickr from 'flatpickr';

let timeInput = null;
let animationInterval = null;
let flatpickrInstance = null;

function handleTimeInputChange(selectedDates) {
    if (!timeInput || selectedDates.length === 0) {
        return;
    }
    const newTime = selectedDates[0];
    if (isNaN(newTime.getTime())) {
        return;
    }
    setCurrentTime(newTime);
    saveState();
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
    
    flatpickrInstance = flatpickr(timeInput, {
        enableTime: true,
        dateFormat: "Y-m-d h:i K",
        time_24hr: false,
        defaultDate: getCurrentTime(),
        minDate: "1993-01-01",
        maxDate: new Date(),
        onChange: handleTimeInputChange,
        onOpen: () => {
            timeInput.dataset.userEditing = 'true';
        },
        onClose: () => {
            delete timeInput.dataset.userEditing;
        },
        onReady: (selectedDates, dateStr, instance) => {
            const calendarContainer = instance.calendarContainer;
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'flatpickr-close-button';
            closeButton.textContent = 'Close';
            closeButton.addEventListener('click', () => {
                instance.close();
            });
            calendarContainer.appendChild(closeButton);
        }
    });
    
    // Update maxDate every 5 minutes for kiosk mode (catches midnight rollover)
    setInterval(() => {
        if (flatpickrInstance) {
            flatpickrInstance.set('maxDate', new Date());
        }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    subscribeToCurrentTime((currentTime) => {
        updateTimeInput(currentTime);
    });
    
    subscribeToRealTime((isRealtime) => {
        updateUI(isRealtime);
        requireInputElement('realtime-mode').checked = isRealtime;
        requireInputElement('archive-mode').checked = !isRealtime;
    });

    const timeStepBackwardButton = requireButtonElement('time-step-backward');
    const timePlayPauseButton = requireButtonElement('time-play-pause');
    const timeStepForwardButton = requireButtonElement('time-step-forward');

    // Set up radio button event listeners
    const realtimeMode = requireInputElement('realtime-mode');
    const archiveMode = requireInputElement('archive-mode');
    const isRealtime = getIsRealTime();

    realtimeMode.checked = isRealtime;
    archiveMode.checked = !isRealtime;

    realtimeMode.addEventListener('change', (evt) => {
        const target = evt.target;
        if (target instanceof HTMLInputElement) {
            setIsRealTime(target.checked);
        }
        saveState();
    });
    archiveMode.addEventListener('change', (evt) => {
        const target = evt.target;
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
    if (flatpickrInstance && !timeInput.dataset.userEditing) {
        flatpickrInstance.setDate(time, false);
    }
}

function stepTime(minutes) {
    const currentTime = getCurrentTime();
    const newTime = new Date(currentTime);
    newTime.setMinutes(currentTime.getMinutes() + minutes);
    setCurrentTime(newTime);
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
