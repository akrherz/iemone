import { getCurrentTime, getIsRealTime, subscribeToCurrentTime, subscribeToRealTime } from './state';
import {
    setArchiveMode,
    setArchiveTime,
    setRealtimeMode,
    stepArchiveTime,
    subscribeToAnimationState,
    toggleAnimation,
} from './timelineController';
import { requireElement, requireButtonElement, requireInputElement } from 'iemjs/domUtils';
import flatpickr from 'flatpickr';

let timeInput = null;
let flatpickrInstance = null;
let progressBar = null;

function handleTimeInputChange(selectedDates) {
    if (!timeInput || selectedDates.length === 0) {
        return;
    }
    const newTime = selectedDates[0];
    if (isNaN(newTime.getTime())) {
        return;
    }
    setArchiveTime(newTime);
}

export function setupTimeInputControl() {
    timeInput = requireElement('current-time');
    const progressContainer = requireElement('animation-progress');
    progressBar = progressContainer.querySelector('.progress');
    if (!(progressBar instanceof HTMLElement)) {
        const createdProgress = document.createElement('div');
        createdProgress.className = 'progress';
        progressContainer.appendChild(createdProgress);
        progressBar = createdProgress;
    }
    
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
    updateUI(isRealtime);

    subscribeToAnimationState(({ isAnimating, progress }) => {
        timePlayPauseButton.textContent = isAnimating ? '⏸︎' : '⏵︎';
        if (progressBar instanceof HTMLElement) {
            progressBar.style.width = `${progress}%`;
        }
    });

    realtimeMode.addEventListener('change', (evt) => {
        const target = evt.target;
        if (target instanceof HTMLInputElement && target.checked) {
            setRealtimeMode();
        }
    });
    archiveMode.addEventListener('change', (evt) => {
        const target = evt.target;
        if (target instanceof HTMLInputElement && target.checked) {
            setArchiveMode();
        }
    });

    timeStepBackwardButton.addEventListener('click', () => stepArchiveTime(-5));
    timeStepForwardButton.addEventListener('click', () => stepArchiveTime(5));
    timePlayPauseButton.addEventListener('click', toggleAnimation);
}

function updateTimeInput(time) {
    if (flatpickrInstance && !timeInput.dataset.userEditing) {
        flatpickrInstance.setDate(time, false);
    }
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
