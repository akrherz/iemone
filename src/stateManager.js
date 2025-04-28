import { loadState } from './statePersistence';

export const StateKeys = {
    CURRENT_TIME: 'currentTime',
    IS_REALTIME: 'isRealtime',
    LAT: 'lat',
    LON: 'lon',
    ZOOM: 'zoom',
};

const savedState = loadState();
const state = {
    [StateKeys.CURRENT_TIME]: savedState?.currentTime ? new Date(savedState.currentTime) : new Date(),
    [StateKeys.IS_REALTIME]: savedState?.isRealtime ?? true,
    [StateKeys.LAT]: savedState?.latitude ?? 39.8283,
    [StateKeys.LON]: savedState?.longitude ?? -98.5795,
    [StateKeys.ZOOM]: savedState?.zoom ?? 4.0,
};
const subscribers = {};

let realtimeInterval = null;

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

// Initialize realtime updates if needed
startRealtimeInterval();