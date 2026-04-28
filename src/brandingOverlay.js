import { getCurrentTime, getIsRealTime, subscribeToRealTime, subscribeToCurrentTime, getState, StateKeys } from "./state";
import { rectifyToFiveMinutes } from "./utils";
import strftime from "strftime";
import { requireElement } from "iemjs/domUtils";
import { isRidgeActive, getCurrentRidgeScanTime } from "./ridgeRadarLayer";

const FMT = '%-I:%M %p';

export function updateAnimationBranding(radarTime) {
    const brandingOverlay = requireElement('branding-overlay');
    const isRealTime = getIsRealTime();
    brandingOverlay.dataset.mode = isRealTime ? 'realtime' : 'archive';
    const modeLabel = isRealTime ? 'Realtime' : 'Archive';

    if (isRidgeActive()) {
        const ridgeRadar = getState(StateKeys.RIDGE_RADAR);
        const ridgeProduct = getState(StateKeys.RIDGE_PRODUCT);
        brandingOverlay.textContent = `IEM1: ${modeLabel} (Animating) RIDGE: ${ridgeRadar} (${ridgeProduct}) ${strftime(FMT, radarTime)}`;
        return;
    }

    const localRadarTime = strftime(FMT, rectifyToFiveMinutes(radarTime));
    const currentTime = getCurrentTime();
    const localWarningsTime = strftime(FMT, currentTime);
    brandingOverlay.textContent = `IEM1: ${modeLabel} (Animating) RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
}

export function updateBrandingOverlay() {
    const isRealTime = getIsRealTime();
    const brandingOverlay = requireElement('branding-overlay');
    const currentTime = getCurrentTime();
    const modeLabel = isRealTime ? 'Realtime' : 'Archive';
    brandingOverlay.dataset.mode = isRealTime ? 'realtime' : 'archive';

    if (isRidgeActive()) {
        const ridgeRadar = getState(StateKeys.RIDGE_RADAR);
        const ridgeProduct = getState(StateKeys.RIDGE_PRODUCT);
        const ridgeScanTs = getCurrentRidgeScanTime();
        const scanLabel = ridgeScanTs
            ? strftime(FMT, new Date(ridgeScanTs))
            : '--';
        brandingOverlay.textContent = `IEM1: ${modeLabel} RIDGE: ${ridgeRadar} (${ridgeProduct}) ${scanLabel}`;
        return;
    }

    const radarTime = rectifyToFiveMinutes(currentTime);
    const localWarningsTime = strftime(FMT, currentTime);
    const localRadarTime = strftime(FMT, radarTime);
    const localTimeMessage = `RADAR: ${localRadarTime} Warnings: ${localWarningsTime}`;
    brandingOverlay.textContent = `IEM1: ${modeLabel} ${localTimeMessage}`;
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
