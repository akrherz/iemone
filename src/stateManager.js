export const StateKeys = {
    CURRENT_TIME: 'currentTime',
    IS_REALTIME: 'isRealTime',
    // Add more keys as needed
};

const state = {
    [StateKeys.CURRENT_TIME]: new Date(),
    [StateKeys.IS_REALTIME]: true
};
const subscribers = {};

/**
 * Get the value of a state key.
 * @param {string} key The state key to retrieve.
 * @returns {*} The current value of the state key.
 */
export function getState(key) {
    return state[key];
}

/**
 * Set the value of a state key and notify subscribers.
 * @param {string} key The state key to update.
 * @param {*} value The new value for the state key.
 */
export function setState(key, value) {
    if (!key) {
        console.error('Invalid key provided to setState.');
        return;
    }
    state[key] = value;
    notifySubscribers(key);
}

/**
 * Subscribe to changes in a state key.
 * @param {string} key The state key to subscribe to.
 * @param {Function} callback The callback to invoke when the state key changes.
 */
export function subscribeToState(key, callback) {
    if (!subscribers[key]) {
        subscribers[key] = [];
    }
    if (typeof callback === 'function') {
        subscribers[key].push(callback);
    }
}

/**
 * Notify all subscribers of a state key change.
 * @param {string} key The state key that changed.
 */
function notifySubscribers(key) {
    if (subscribers[key]) {
        subscribers[key].forEach((callback) => callback(state[key]));
    }
}

// Sundry helpers to avoid repetition

export function getCurrentTime() {
    return getState(StateKeys.CURRENT_TIME);
}
export function setCurrentTime(time) {
    setState(StateKeys.CURRENT_TIME, time);
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