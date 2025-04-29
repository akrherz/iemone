const STATE_KEY = 'iemone_state';
import { StateKeys, getState } from './stateManager';
import { getActivePhenomenaSignificance } from './warningsLayer';

export function saveState() {
    const currentTime = getState(StateKeys.CURRENT_TIME);
    const activePhenomena = getActivePhenomenaSignificance();
    const isRealtime = getState(StateKeys.IS_REALTIME);
    const localstate = {
        activePhenomena,
        latitude: getState(StateKeys.LAT),
        longitude: getState(StateKeys.LON),
        zoom: getState(StateKeys.ZOOM),
        isRealtime,
        currentTime: (currentTime && !isRealtime) ? currentTime.toISOString() : null
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(localstate));
}

export function loadState() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // Reconstitute the Set from the array
            if (state?.activePhenomena && Array.isArray(state.activePhenomena)) {
                state.activePhenomena = new Set(state.activePhenomena);
            } else {
                state.activePhenomena = new Set();
            }

            // Convert ISO string back to Date if it exists
            if (state.currentTime) {
                state.currentTime = new Date(state.currentTime);
            }

            // Ensure isRealtime has a boolean value
            state.isRealtime = state.isRealtime ?? true;

            // If isRealtime, then set the currentTime to now
            if (state.isRealtime) {
                state.currentTime = new Date();
            }
            return state;
        } catch (e) {
            console.error('Failed to parse saved state:', e);
            return null;
        }
    }
    return null;
}