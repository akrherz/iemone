
import { subscribeToRealTime } from "./stateManager";

function updateBrandingOverlay(mode) {
    const brandingOverlay = document.getElementById('branding-overlay');
    if (brandingOverlay) {
        brandingOverlay.dataset.mode = mode;
        brandingOverlay.textContent = `IEM1: ${mode === 'realtime' ? 'Realtime' : 'Archive'}`;
    }
}

export function initBrandingOverlay() {
    subscribeToRealTime((isRealTime) => {
        const mode = isRealTime ? 'realtime' : 'archive';
        updateBrandingOverlay(mode);
    });
}
