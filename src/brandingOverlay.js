import { getCurrentTime, getIsRealTime, subscribeToRealTime, subscribeToCurrentTime } from "./state";
import { rectifyToFiveMinutes } from "./utils";
import strftime from "strftime";
import { requireElement } from "./domUtils";

const FMT = '%-I:%M %p';

export function updateAnimationBranding(radarTime) {
    const brandingOverlay = requireElement('branding-overlay');
    
    const localRadarTime = strftime(FMT, rectifyToFiveMinutes(radarTime));
    const currentTime = getCurrentTime();
    const localWarningsTime = strftime(FMT, currentTime);
    
    brandingOverlay.dataset.mode = 'archive';
    brandingOverlay.textContent = `IEM1: Archive (Animating) RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
}

export function updateBrandingOverlay() {
    const isRealTime = getIsRealTime();
    const brandingOverlay = requireElement('branding-overlay');
    const currentTime = getCurrentTime();
    const radarTime = rectifyToFiveMinutes(currentTime);
    const localWarningsTime = strftime(FMT, currentTime);
    const localRadarTime = strftime(FMT, radarTime);
    const localTimeMessage = `RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
    brandingOverlay.dataset.mode = isRealTime ? 'realtime' : 'archive';
    const title = `IEM1: ${isRealTime ? 'Realtime' : 'Archive'} ${localTimeMessage}`;
    brandingOverlay.textContent = title;
}

export function initBrandingOverlay() {
    subscribeToRealTime(() => {
        updateBrandingOverlay();
    });
    subscribeToCurrentTime(() => {
        updateBrandingOverlay();
    });
    updateBrandingOverlay();
}
