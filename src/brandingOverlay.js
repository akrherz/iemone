import { getCurrentTime, getIsRealTime, subscribeToRealTime, subscribeToCurrentTime } from "./stateManager";
import { rectifyToFiveMinutes } from "./utils";

export function updateAnimationBranding(radarTime) {
    const brandingOverlay = document.getElementById('branding-overlay');
    if (!brandingOverlay) return;
    
    const localRadarTime = rectifyToFiveMinutes(radarTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentTime = getCurrentTime();
    const localWarningsTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    brandingOverlay.dataset.mode = 'archive';
    brandingOverlay.textContent = `IEM1: Archive (Animating) RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
}

export function updateBrandingOverlay() {
    const isRealTime = getIsRealTime();
    const brandingOverlay = document.getElementById('branding-overlay');
    if (!brandingOverlay) {
        return;
    }
    const currentTime = getCurrentTime();
    const radarTime = rectifyToFiveMinutes(currentTime);
    const localWarningsTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localRadarTime = radarTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localTimeMessage = `RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
    brandingOverlay.dataset.mode = isRealTime ? 'realtime' : 'archive';
    const title = `IEM1: ${isRealTime ? 'Realtime' : 'Archive'} ${localTimeMessage}`;
    brandingOverlay.textContent = title;
}

export function initBrandingOverlay() {
    subscribeToRealTime(() => {
        updateBrandingOverlay();
    });
    subscribeToCurrentTime((_currentTime) => {
        updateBrandingOverlay();
    });
    updateBrandingOverlay();
}
