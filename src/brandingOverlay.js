import { getCurrentTime, getIsRealTime, subscribeToRealTime, subscribeToCurrentTime } from "./stateManager";
import { rectifyToFiveMinutes } from "./utils";

function updateBrandingOverlay(mode) {
    const brandingOverlay = document.getElementById('branding-overlay');
    if (!brandingOverlay) {
        return;
    }
    const currentTime = getCurrentTime();
    const radarTime = rectifyToFiveMinutes(currentTime);
    const localWarningsTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localRadarTime = radarTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localTimeMessage = `RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
    brandingOverlay.dataset.mode = mode;
    const title = `IEM1: ${mode === 'realtime' ? 'Realtime' : 'Archive'} ${localTimeMessage}`;
    brandingOverlay.textContent = title;
}

export function updateRadarTime(radarTime) {
    const brandingOverlay = document.getElementById('branding-overlay');
    if (!brandingOverlay) {
        return;
    }
    const mode = getIsRealTime() ? 'realtime' : 'archive';
    const currentTime = getCurrentTime();
    const localWarningsTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localRadarTime = radarTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localTimeMessage = `RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
    const title = `IEM1: ${mode === 'realtime' ? 'Realtime' : 'Archive'} ${localTimeMessage}`;
    brandingOverlay.textContent = title;
}

export function initBrandingOverlay() {
    subscribeToRealTime((isRealTime) => {
        const mode = isRealTime ? 'realtime' : 'archive';
        updateBrandingOverlay(mode);
    });
    subscribeToCurrentTime((_currentTime) => {
        const mode = getIsRealTime() ? 'realtime' : 'archive';
        updateBrandingOverlay(mode);
    });
}
