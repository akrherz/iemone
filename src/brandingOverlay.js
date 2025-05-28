import { getCurrentTime, getIsRealTime, subscribeToRealTime, subscribeToCurrentTime } from "./state";
import { rectifyToFiveMinutes } from "./utils";
import strftime from "strftime";

export function updateAnimationBranding(radarTime) {
    const brandingOverlay = document.getElementById('branding-overlay');
    if (!brandingOverlay) return;
    
    const localRadarTime = strftime('%H:%M', rectifyToFiveMinutes(radarTime));
    const currentTime = getCurrentTime();
    const localWarningsTime = strftime('%H:%M', currentTime);
    
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
    const localWarningsTime = strftime('%H:%M', currentTime);
    const localRadarTime = strftime('%H:%M', radarTime);
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
