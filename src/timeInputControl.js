import { updateRadarTMSLayer } from './radarTMSLayer';
import { updateURL } from './urlHandler';

export function setupTimeInputControl(currentTime, radarTMSLayer, map, warningsLayer) {
    const timeInput = document.getElementById('current-time');

    function updateTimeInput() {
        if (timeInput) {
            const year = currentTime.getFullYear();
            const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
            const day = currentTime.getDate().toString().padStart(2, '0');
            const hours = currentTime.getHours().toString().padStart(2, '0');
            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
            timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }

    function updateGeoJSONLayer() {
        if (warningsLayer) {
            warningsLayer.getSource().setUrl(`/geojson/sbw.py?ts=${currentTime.toISOString()}`);
            warningsLayer.getSource().refresh();
        }
    }

    function handleTimeInputChange(event) {
        const newTime = new Date(event.target.value);
        if (!isNaN(newTime)) {
            currentTime.setTime(newTime.getTime());
            updateTimeInput();
            updateRadarTMSLayer(radarTMSLayer, currentTime);
            updateGeoJSONLayer();
            updateURL(map, currentTime);
            showToaster('Timestamp updated!');
        }
    }

    function showToaster(message) {
        const toaster = document.getElementById('toaster');
        if (toaster) {
            toaster.textContent = message;
            toaster.style.display = 'block';
            setTimeout(() => {
                toaster.style.display = 'none';
            }, 3000);
        }
    }

    if (timeInput) {
        timeInput.addEventListener('change', handleTimeInputChange);
    }

    updateTimeInput(); // Initialize the time input field
}

export function setupTimeButtons(currentTime, radarTMSLayer, map, warningsLayer) {
    const timeStepBackwardButton = document.getElementById('time-step-backward');
    const timePlayPauseButton = document.getElementById('time-play-pause');
    const timeStepForwardButton = document.getElementById('time-step-forward');
    const realtimeModeButton = document.getElementById('realtime-mode');

    let animationInterval = null;

    function stepTime(minutes) {
        const now = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + minutes);

        // Ensure radar layer uses rectified time
        const radarTime = new Date(currentTime);
        radarTime.setMinutes(Math.floor(radarTime.getMinutes() / 5) * 5, 0, 0);

        // Prevent selecting a timestamp from the future
        if (currentTime > now) {
            currentTime.setTime(now.getTime());
        }

        updateRadarTMSLayer(radarTMSLayer, radarTime);
        if (warningsLayer) {
            warningsLayer.getSource().setUrl(`/geojson/sbw.py?ts=${currentTime.toISOString()}`);
            warningsLayer.getSource().refresh();
        }
        updateURL(map, currentTime);
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
            updateURL(map, currentTime);
            progressBar.style.width = '0%';
        } else {
            const startTime = new Date();
            startTime.setMinutes(startTime.getMinutes() - 55);
            currentTime = new Date(startTime);

            let steps = 0;
            const totalSteps = 12;

            animationInterval = setInterval(() => {
                const now = new Date();
                if (steps >= totalSteps || currentTime >= now) {
                    steps = 0;
                    currentTime = new Date(now.getTime() - 55 * 60 * 1000);
                } else {
                    currentTime.setMinutes(currentTime.getMinutes() + 5);
                    if (currentTime > now) {
                        currentTime = now;
                    }
                    steps++;
                }

                updateRadarTMSLayer(radarTMSLayer, currentTime);

                const progressPercentage = (steps / totalSteps) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }, 1000);

            timePlayPauseButton.textContent = '⏸';
        }
    }

    function toggleRealTimeMode() {
        const queryParams = new URLSearchParams(window.location.search);

        if (realtimeModeButton.textContent === '🔴') {
            clearInterval(animationInterval);
            animationInterval = null;
            realtimeModeButton.textContent = '⏱';
            queryParams.delete('realtime');
            updateURL(map, currentTime);
        } else {
            realtimeModeButton.textContent = '🔴';
            queryParams.set('realtime', '1');
            updateURL(map, currentTime);
        }
    }

    timeStepBackwardButton.addEventListener('click', () => stepTime(-5));
    timeStepForwardButton.addEventListener('click', () => stepTime(5));
    timePlayPauseButton.addEventListener('click', toggleAnimation);
    realtimeModeButton.addEventListener('click', toggleRealTimeMode);
}

export function stepTime(minutes, currentTime, radarTMSLayer, warningsLayer, map) {
    const now = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + minutes);

    // Ensure radar layer uses rectified time
    const radarTime = new Date(currentTime);
    radarTime.setMinutes(Math.floor(radarTime.getMinutes() / 5) * 5, 0, 0);

    // Prevent selecting a timestamp from the future
    if (currentTime > now) {
        currentTime.setTime(now.getTime());
    }

    const timeInput = document.getElementById('current-time');
    if (timeInput) {
        const year = currentTime.getFullYear();
        const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
        const day = currentTime.getDate().toString().padStart(2, '0');
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    updateRadarTMSLayer(radarTMSLayer, radarTime);
    if (warningsLayer) {
        warningsLayer.getSource().setUrl(`/geojson/sbw.py?ts=${currentTime.toISOString()}`);
        warningsLayer.getSource().refresh();
    }
    updateURL(map, currentTime);
}
