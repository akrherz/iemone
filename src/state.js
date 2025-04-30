const STATE_KEY = 'iemone_state';
export const StateKeys = {
    CURRENT_TIME: 'currentTime',
    IS_REALTIME: 'isRealtime',
    LAT: 'lat',
    LON: 'lon',
    ZOOM: 'zoom',
    ACTIVE_PHENOMENA: 'activePhenomena'
};

// Add initial active phenomena set
const defaultActivePhenomena = new Set([
    "TO.W", "SV.W", "FF.W", "FL.W", "MA.W",
    "DS.W", "SQ.W", "EW.W", "FL.Y", "FA.Y", "DS.Y"
]);

const savedState = loadState();
const state = {
    [StateKeys.CURRENT_TIME]: savedState?.currentTime ? new Date(savedState.currentTime) : new Date(),
    [StateKeys.IS_REALTIME]: savedState?.isRealtime ?? true,
    [StateKeys.LAT]: savedState?.latitude ?? 39.8283,
    [StateKeys.LON]: savedState?.longitude ?? -98.5795,
    [StateKeys.ZOOM]: savedState?.zoom ?? 4.0,
    [StateKeys.ACTIVE_PHENOMENA]: savedState?.activePhenomena ?? new Set(defaultActivePhenomena)
};
const subscribers = {};

let realtimeInterval = null;

function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && state[StateKeys.IS_REALTIME]) {
        // Immediately update the time when tab becomes visible
        setState(StateKeys.CURRENT_TIME, new Date());
        // Restart the interval to ensure it's in sync
        startRealtimeInterval();
    }
}

// Add visibility change listener
document.addEventListener('visibilitychange', handleVisibilityChange);

function startRealtimeInterval() {
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
    }
    
    if (state[StateKeys.IS_REALTIME]) {
        realtimeInterval = setInterval(() => {
            const now = new Date();
            if (now.getTime() !== state[StateKeys.CURRENT_TIME].getTime()) {
                setState(StateKeys.CURRENT_TIME, now);
            }
        }, 60000);
    }
}

export function getState(key) {
    return state[key];
}

export function setState(key, value) {
    if (!key) {
        return;
    }
    const oldValue = state[key];
    state[key] = value;
    
    // Special handling for realtime mode changes
    if (key === StateKeys.IS_REALTIME && oldValue !== value) {
        if (value === true) {
            const now = new Date();
            state[StateKeys.CURRENT_TIME] = now;
            notifySubscribers(StateKeys.CURRENT_TIME);
            startRealtimeInterval();
        } else {
            if (realtimeInterval) {
                clearInterval(realtimeInterval);
                realtimeInterval = null;
            }
        }
    }
    
    notifySubscribers(key);
}

export function subscribeToState(key, callback) {
    if (!subscribers[key]) {
        subscribers[key] = [];
    }
    if (typeof callback === 'function') {
        subscribers[key].push(callback);
    }
}

function notifySubscribers(key) {
    if (subscribers[key]) {
        subscribers[key].forEach((callback) => callback(state[key]));
    }
}

// Time-specific helper functions
export function getCurrentTime() {
    return getState(StateKeys.CURRENT_TIME);
}

export function setCurrentTime(time) {
    setState(StateKeys.CURRENT_TIME, new Date(time));
    // Switching to a specific time disables realtime mode
    setState(StateKeys.IS_REALTIME, false);
}

export function subscribeToCurrentTime(callback) {
    subscribeToState(StateKeys.CURRENT_TIME, callback);
}

export function getIsRealTime() {
    return getState(StateKeys.IS_REALTIME);
}

export function setIsRealTime(isRealtime) {
    setState(StateKeys.IS_REALTIME, isRealtime);
}

export function subscribeToRealTime(callback) {
    subscribeToState(StateKeys.IS_REALTIME, callback);
}

export function getActivePhenomena() {
    return state[StateKeys.ACTIVE_PHENOMENA];
}

export function toggleActivePhenomenon(key) {
    const phenomena = state[StateKeys.ACTIVE_PHENOMENA];
    if (phenomena.has(key)) {
        phenomena.delete(key);
    } else {
        phenomena.add(key);
    }
    setState(StateKeys.ACTIVE_PHENOMENA, phenomena);
    return phenomena.has(key);
}

// Update saveState function
export function saveState() {
    const currentTime = getState(StateKeys.CURRENT_TIME);
    const activePhenomena = Array.from(getActivePhenomena());
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
            if (state?.activePhenomena && Array.isArray(state.activePhenomena) && state.activePhenomena.length > 0) {
                state.activePhenomena = new Set(state.activePhenomena);
            } else {
                state.activePhenomena = new Set(defaultActivePhenomena);
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

// Initialize realtime updates if needed
startRealtimeInterval();