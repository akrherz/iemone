import './style.css';
import { initializeMap } from './map';
import { createWarningsLayer } from './warningsLayer';
import { setupWarningsTable } from './warningsTable';
import { createRadarTMSLayer, updateRadarTMSLayer } from './radarTMSLayer'; // Ensure updateRadarTMSLayer is imported
import { getQueryParams, updateURL } from './urlHandler';
import { setupWarningsModal } from './warningsModal';
import { setupTimeInputControl, setupTimeButtons } from './timeInputControl'; // Import updated module
import { showToaster } from './toaster'; // Import toaster module

document.addEventListener('DOMContentLoaded', () => {
    const map = initializeMap();
    const warningsTable = document.getElementById('warnings-table');
    let currentTime = new Date();

    const radarTMSLayer = createRadarTMSLayer(map, currentTime);
    const warningsLayer = createWarningsLayer(map, warningsTable, currentTime);

    setupWarningsTable(warningsTable, warningsLayer);
    setupWarningsModal();
    setupTimeInputControl(currentTime, radarTMSLayer, map, warningsLayer);
    setupTimeButtons(currentTime, radarTMSLayer, map, warningsLayer); // Initialize time button functionality

    const realtimeModeButton = document.getElementById('realtime-mode'); // Declare and initialize

    function rectifyToFiveMinutes(date) {
        const minutes = date.getMinutes();
        const rectifiedMinutes = Math.floor(minutes / 5) * 5;
        date.setMinutes(rectifiedMinutes, 0, 0);
        return date;
    }

    // Animation logic to toggle visibility
    function toggleAnimation() {
        let progressBar = document.querySelector('#animation-progress .progress');

        // Ensure the progress bar element exists
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
            updateURL(map, currentTime); // Update the URL to reflect the final state after stopping the animation
            progressBar.style.width = '0%'; // Reset progress bar
        } else {
            const startTime = new Date();
            startTime.setMinutes(startTime.getMinutes() - 55); // Start 55 minutes ago
            currentTime = rectifyToFiveMinutes(startTime);
            updateTimeInput(); // Update the timestamp in the input field
            updateRadarTMSLayer(radarTMSLayer, currentTime); // Direct call to updateRadarTMSLayer

            let steps = 0;
            const totalSteps = 12; // 12 timesteps of 5 minutes each

            animationInterval = setInterval(() => {
                const now = rectifyToFiveMinutes(new Date()); // Current time rectified to 5-minute intervals
                if (steps >= totalSteps || currentTime >= now) {
                    steps = 0; // Reset steps
                    currentTime = rectifyToFiveMinutes(new Date(now.getTime() - 55 * 60 * 1000)); // Reset to 55 minutes ago
                } else {
                    currentTime.setMinutes(currentTime.getMinutes() + 5); // Advance by 5 minutes
                    currentTime = rectifyToFiveMinutes(currentTime);

                    // Prevent advancing into the future
                    if (currentTime > now) {
                        currentTime = now;
                    }

                    steps++;
                }

                updateRadarTMSLayer(radarTMSLayer, currentTime); // Direct call to updateRadarTMSLayer
                updateTimeInput(); // Update the timestamp in the input field

                // Update progress bar
                const progressPercentage = (steps / totalSteps) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }, 1000); // 1s per frame

            timePlayPauseButton.textContent = '⏸';
            showToaster(''); // Clear toaster during animation
        }
    }

    let realTimeInterval = null;

    function updateBrandingOverlay(mode) {
        const brandingOverlay = document.getElementById('branding-overlay');
        if (brandingOverlay) {
            brandingOverlay.dataset.mode = mode;
            brandingOverlay.textContent = `IEM1: ${mode === 'realtime' ? 'Realtime' : 'Archive'}`;
        }
    }

    function toggleRealTimeMode() {
        const queryParams = new URLSearchParams(window.location.search);
        const timeInput = document.getElementById('current-time');
        const timeStepBackwardButton = document.getElementById('time-step-backward');
        const timeStepForwardButton = document.getElementById('time-step-forward');

        if (realTimeInterval) {
            clearInterval(realTimeInterval);
            realTimeInterval = null;
            realtimeModeButton.textContent = '⏱';
            realtimeModeButton.title = 'Enable Real-Time Mode';
            queryParams.delete('realtime');
            history.replaceState(null, '', `?${queryParams.toString()}`);
            updateBrandingOverlay('archive'); // Switch to archive mode

            // Enable time input and buttons
            timeInput.disabled = false;
            timeInput.title = ''; // Clear tooltip
            timeStepBackwardButton.disabled = false;
            timeStepBackwardButton.title = ''; // Clear tooltip
            timeStepForwardButton.disabled = false;
            timeStepForwardButton.title = ''; // Clear tooltip
        } else {
            // Advance currentTime to the most current possible timestamp
            const now = new Date();
            currentTime = new Date(now);
            updateTimeInput(); // Update the timestamp in the input field
            updateRadarTMSLayer(radarTMSLayer, new Date(Math.floor(now.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000))); // Rectified time for radar
            updateGeoJSONLayer(); // Update warnings layer

            realTimeInterval = setInterval(() => {
                const lnow = new Date();
                currentTime = new Date(lnow);
                updateTimeInput(); // Update the timestamp in the input field
                updateRadarTMSLayer(radarTMSLayer, new Date(Math.floor(lnow.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000))); // Rectified time for radar
                updateGeoJSONLayer(); // Update warnings layer
            }, 60000); // Update every minute
            realtimeModeButton.textContent = '🔴';
            realtimeModeButton.title = 'Disable Real-Time Mode';
            queryParams.set('realtime', '1');
            history.replaceState(null, '', `?${queryParams.toString()}`);
            updateBrandingOverlay('realtime'); // Switch to real-time mode

            // Disable time input and buttons
            timeInput.disabled = true;
            timeInput.title = 'Disabled in Real-Time Mode'; // Add tooltip
            timeStepBackwardButton.disabled = true;
            timeStepBackwardButton.title = 'Disabled in Real-Time Mode'; // Add tooltip
            timeStepForwardButton.disabled = true;
            timeStepForwardButton.title = 'Disabled in Real-Time Mode'; // Add tooltip
        }
    }

    // Initialize app state from URL
    const queryParams = getQueryParams(); // Use the new module to read URL parameters
    if (queryParams.realtime === '1') {
        toggleRealTimeMode();
        updateBrandingOverlay('realtime');
    } else if (queryParams.timestamp) {
        const year = parseInt(queryParams.timestamp.slice(0, 4), 10);
        const month = parseInt(queryParams.timestamp.slice(4, 6), 10) - 1;
        const day = parseInt(queryParams.timestamp.slice(6, 8), 10);
        const hours = parseInt(queryParams.timestamp.slice(8, 10), 10);
        const minutes = parseInt(queryParams.timestamp.slice(10, 12), 10);
        currentTime = new Date(Date.UTC(year, month, day, hours, minutes));
        updateBrandingOverlay('archive');
    } else {
        // Default to real-time mode if no timestamp is provided
        toggleRealTimeMode();
        updateBrandingOverlay('realtime');
    }

    if (queryParams.center) {
        const [lon, lat] = queryParams.center.split(',').map(Number);
        map.getView().setCenter(fromLonLat([lon, lat]));
    }
    if (queryParams.zoom) {
        map.getView().setZoom(Number(queryParams.zoom));
    }

    let animationInterval = null;

    // Update URL whenever the app state changes
    map.getView().on('change:center', () => updateURL(map, currentTime)); // Use the new module to update URL
    map.getView().on('change:zoom', () => updateURL(map, currentTime));

    // Initialize time display
    currentTime = rectifyToFiveMinutes(currentTime);
    updateTimeInput();

    // Layers drawer functionality
    const layersToggle = document.getElementById('layers-toggle');
    const layerControl = document.getElementById('layer-control');

    if (layersToggle && layerControl) {
        layersToggle.addEventListener('click', () => {
            layerControl.classList.toggle('open'); // Toggle the `open` class
        });
    } else {
        console.error('Layers toggle or layer control element not found.');
    }

    // Layer toggle functionality
    const tmsLayerToggle = document.getElementById('toggle-tms-layer');
    const tmsOpacitySlider = document.getElementById('tms-opacity-slider');

    if (tmsLayerToggle) {
        tmsLayerToggle.addEventListener('change', (event) => {
            if (event.target.checked) {
                // Enable the TMS layer
                radarTMSLayer.setVisible(true);
            } else {
                // Disable the TMS layer
                radarTMSLayer.setVisible(false);
            }
        });

        // Initialize the TMS layer visibility
        radarTMSLayer.setVisible(tmsLayerToggle.checked);
    }

    if (tmsOpacitySlider) {
        tmsOpacitySlider.addEventListener('input', (event) => {
            radarTMSLayer.setOpacity(parseFloat(event.target.value));
        });

        // Initialize the TMS layer opacity
        radarTMSLayer.setOpacity(parseFloat(tmsOpacitySlider.value));
    }

    function updateTimeInput() {
        const timeInput = document.getElementById('current-time');
        if (timeInput) {
            // Format the current time in the browser's local timezone
            const year = currentTime.getFullYear();
            const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
            const day = currentTime.getDate().toString().padStart(2, '0');
            const hours = currentTime.getHours().toString().padStart(2, '0');
            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
            timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`; // Format as "YYYY-MM-DDTHH:mm"
        }
    }

    // Update the timestamp selector logic to include toaster notification
    function handleTimeInputChange(event) {
        const newTime = new Date(event.target.value);
        if (!isNaN(newTime)) {
            currentTime = newTime;
            updateTimeInput(); // Update the timestamp in the input field
            updateRadarTMSLayer(radarTMSLayer, currentTime); // Direct call to updateRadarTMSLayer
            updateGeoJSONLayer(); // Ensure GeoJSON layer is updated
            updateURL(map, currentTime);
            showToaster('Timestamp updated!'); // Show toaster notification
        }
    }

    // Event listener for the time input field
    const timeInput = document.getElementById('current-time');
    if (timeInput) {
        timeInput.addEventListener('change', handleTimeInputChange);
    }

    // Initialize the time input field
    updateTimeInput();

    // Function to update the GeoJSON layer
    function updateGeoJSONLayer() {
        if (warningsLayer) {
            warningsLayer.getSource().setUrl(`/geojson/sbw.py?ts=${currentTime.toISOString()}`);
            warningsLayer.getSource().refresh();
        }
    }

    // Warnings modal functionality
    const warningsToggle = document.getElementById('warnings-toggle');
    const warningsModal = document.getElementById('warnings-modal');
    const warningsModalContent = document.getElementById('warnings-modal-content');
    const closeWarningsButton = document.getElementById('close-warnings');
    const collapseWarningsButton = document.getElementById('collapse-warnings');

    if (warningsToggle && warningsModal) {
        // Toggle warnings modal visibility
        warningsToggle.addEventListener('click', () => {
            warningsModal.classList.toggle('open');
        });

        // Collapse button functionality
        if (collapseWarningsButton) {
            collapseWarningsButton.style.display = window.innerWidth <= 768 ? 'block' : 'none';
            collapseWarningsButton.addEventListener('click', () => {
                warningsModal.classList.remove('open');
            });
        }

        // Close button functionality
        if (closeWarningsButton) {
            closeWarningsButton.addEventListener('click', () => {
                warningsModal.classList.remove('open');
            });
        }
    } else {
        console.error('Warnings toggle or warnings modal element not found.');
    }

    // Make modal draggable
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    warningsModalContent.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - warningsModal.offsetLeft;
        offsetY = e.clientY - warningsModal.offsetTop;
        warningsModal.style.transition = 'none'; // Disable transition during drag
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            warningsModal.style.left = `${e.clientX - offsetX}px`;
            warningsModal.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        warningsModal.style.transition = ''; // Re-enable transition
    });

    // Add search functionality for warnings table
    const searchInput = document.getElementById('warnings-search');
    searchInput.addEventListener('input', (event) => {
        const filter = event.target.value.toLowerCase();
        const rows = document.querySelectorAll('#warnings-table tbody tr');
        rows.forEach((row) => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });
});