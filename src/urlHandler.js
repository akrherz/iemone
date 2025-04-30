// Handles things with the URL
import { getCurrentTime, setCurrentTime, subscribeToState, setState, StateKeys } from './state';
import { formatTimestampToUTC } from './utils';

function getQueryParams() {
    const queryParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(queryParams.entries());
}

function updateQueryParams(key, value) {
    const queryParams = new URLSearchParams(window.location.search);
    if (value === null) {
        queryParams.delete(key);
    } else {
        queryParams.set(key, value);
    }
    history.replaceState(null, '', `?${queryParams.toString()}`);
}

export function initializeURLHandler() {
    // Handle initial URL parameters
    const params = getQueryParams();
    if (params.timestamp) {
        const year = parseInt(params.timestamp.slice(0, 4), 10);
        const month = parseInt(params.timestamp.slice(4, 6), 10) - 1;
        const day = parseInt(params.timestamp.slice(6, 8), 10);
        const hours = parseInt(params.timestamp.slice(8, 10), 10);
        const minutes = parseInt(params.timestamp.slice(10, 12), 10);
        const time = new Date(Date.UTC(year, month, day, hours, minutes));
        // This also disables realtime mode
        setCurrentTime(time);
    }
    // Handle initial map position from URL
    if (params.lon && params.lat  && params.zoom) {
        setState(StateKeys.LON, parseFloat(params.lon));
        setState(StateKeys.LAT, parseFloat(params.lat));
        setState(StateKeys.ZOOM, parseFloat(params.zoom));
    }

    // Subscribe to state changes
    subscribeToState(StateKeys.CURRENT_TIME, (currentTime) => {
        updateQueryParams('timestamp', formatTimestampToUTC(currentTime));
    });

    subscribeToState(StateKeys.IS_REALTIME, (isRealtime) => {
        if (isRealtime) {
            updateQueryParams('timestamp', null);
        } else {
            updateQueryParams('timestamp', formatTimestampToUTC(getCurrentTime()));
        }
    });

    subscribeToState(StateKeys.LON, (lon) => {
        if (lon !== null) {
            updateQueryParams('lon', lon.toFixed(4));
        }
    });
    subscribeToState(StateKeys.LAT, (lat) => {
        if (lat !== null) {
            updateQueryParams('lat', lat.toFixed(4));
        }
    });
    subscribeToState(StateKeys.ZOOM, (zoom) => {
        if (zoom !== null) {
            updateQueryParams('zoom', zoom);
        }
    });
}
