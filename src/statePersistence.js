const STATE_KEY = 'iemone_state';
import { StateKeys, getState } from './stateManager';

export function saveState({
    radarVisible,
    radarOpacity,
    warningsVisible,
    activePhenomena,
}) {
    const currentTime = getState(StateKeys.CURRENT_TIME);
    const localstate = {
        radarVisible,
        radarOpacity,
        warningsVisible,
        activePhenomena: Array.from(activePhenomena || []),
        latitude: getState(StateKeys.LAT),
        longitude: getState(StateKeys.LON),
        zoom: getState(StateKeys.ZOOM),
        isRealtime: getState(StateKeys.IS_REALTIME),
        currentTime: currentTime ? currentTime.toISOString() : null
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(localstate));
}

export function loadState() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // Reconstitute the Set from the array
            state.activePhenomena = new Set(state.activePhenomena || []);
            
            // Convert ISO string back to Date if it exists
            if (state.currentTime) {
                state.currentTime = new Date(state.currentTime);
            }
            
            // Ensure isRealtime has a boolean value
            state.isRealtime = state.isRealtime ?? true;
            
            return state;
        } catch (e) {
            console.error('Failed to parse saved state:', e);
            return null;
        }
    }
    return null;
}