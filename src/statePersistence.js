const STATE_KEY = 'iemone_state';

export function saveState({
    radarVisible,
    radarOpacity,
    warningsVisible,
    activePhenomena
}) {
    const state = {
        radarVisible,
        radarOpacity,
        warningsVisible,
        activePhenomena: Array.from(activePhenomena)
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function loadState() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            state.activePhenomena = new Set(state.activePhenomena);
            return state;
        } catch (e) {
            console.error('Failed to parse saved state:', e);
            return null;
        }
    }
    return null;
}