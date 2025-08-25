const STATE_KEY = 'iemone_state';
export const StateKeys = {
    CURRENT_TIME: 'currentTime',
    IS_REALTIME: 'isRealtime',
    LAT: 'lat',
    LON: 'lon',
    ZOOM: 'zoom',
    ACTIVE_PHENOMENA: 'activePhenomena',
    LAYER_VISIBILITY: 'layerVisibility',
    BASE_LAYER: 'baseLayer'
};

// Add initial active phenomena set
const defaultActivePhenomena = new Set([
    "TO.W", "SV.W", "FF.W", "FL.W", "MA.W",
    "DS.W", "SQ.W", "EW.W", "FL.Y", "FA.Y", "DS.Y"
]);

// Default layer visibility state
const defaultLayerVisibility = {
    radar: true,
    warnings: true,
    sps: true,
    pointobs: true,
    webcam: true,
    dashcam: false,
    rwis: false
};

const sstate = loadState();
const state = {
    [StateKeys.CURRENT_TIME]: sstate?.currentTime ? new Date(sstate.currentTime) : new Date(),
    [StateKeys.IS_REALTIME]: sstate?.isRealtime ?? true,
    [StateKeys.LAT]: sstate?.latitude ?? 39.8283,
    [StateKeys.LON]: sstate?.longitude ?? -98.5795,
    [StateKeys.ZOOM]: sstate?.zoom ?? 4.0,
    [StateKeys.ACTIVE_PHENOMENA]: sstate?.activePhenomena ?? new Set(defaultActivePhenomena),
    [StateKeys.LAYER_VISIBILITY]: sstate?.layerVisibility ?? { ...defaultLayerVisibility },
    [StateKeys.BASE_LAYER]: sstate?.baseLayer ?? 'esri-hybrid'
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

// Layer visibility helper functions
export function getLayerVisibility(layerName) {
    const visibility = state[StateKeys.LAYER_VISIBILITY];
    return visibility[layerName] ?? defaultLayerVisibility[layerName] ?? false;
}

export function setLayerVisibility(layerName, visible) {
    const visibility = { ...state[StateKeys.LAYER_VISIBILITY] };
    visibility[layerName] = visible;
    setState(StateKeys.LAYER_VISIBILITY, visibility);
}

export function getAllLayerVisibility() {
    return state[StateKeys.LAYER_VISIBILITY];
}

// Update saveState function
export function saveState() {
    const currentTime = getState(StateKeys.CURRENT_TIME);
    const activePhenomena = Array.from(getActivePhenomena());
    const isRealtime = getState(StateKeys.IS_REALTIME);
    const layerVisibility = getState(StateKeys.LAYER_VISIBILITY);
    const baseLayer = getState(StateKeys.BASE_LAYER);
    const localstate = {
        activePhenomena,
        latitude: getState(StateKeys.LAT),
        longitude: getState(StateKeys.LON),
        zoom: getState(StateKeys.ZOOM),
        isRealtime,
        currentTime: (currentTime && !isRealtime) ? currentTime.toISOString() : null,
        layerVisibility,
        baseLayer
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(localstate));
}

export function loadState() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        try {
            const lstate = JSON.parse(savedState);
            // Reconstitute the Set from the array
            if (lstate?.activePhenomena && Array.isArray(lstate.activePhenomena) && lstate.activePhenomena.length > 0) {
                lstate.activePhenomena = new Set(lstate.activePhenomena);
            } else {
                lstate.activePhenomena = new Set(defaultActivePhenomena);
            }

            // Ensure layer visibility has proper defaults
            if (lstate?.layerVisibility && typeof lstate.layerVisibility === 'object') {
                lstate.layerVisibility = { ...defaultLayerVisibility, ...lstate.layerVisibility };
            } else {
                lstate.layerVisibility = { ...defaultLayerVisibility };
            }

            // Convert ISO string back to Date if it exists
            if (lstate.currentTime) {
                const parsedDate = new Date(lstate.currentTime);
                if (isNaN(parsedDate.getTime())) {
                    // Invalid date string, switch to realtime mode
                    lstate.currentTime = new Date();
                    lstate.isRealtime = true;
                } else {
                    lstate.currentTime = parsedDate;
                }
            }

            // Ensure isRealtime has a boolean value
            lstate.isRealtime = lstate.isRealtime ?? true;

            // If isRealtime, then set the currentTime to now
            if (lstate.isRealtime) {
                lstate.currentTime = new Date();
            }
            return lstate;
        } catch (e) {
            console.error('Failed to parse saved state:', e);
            return null;
        }
    }
    return null;
}

// Initialize realtime updates if needed
startRealtimeInterval();