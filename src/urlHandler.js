import { fromLonLat, toLonLat } from 'ol/proj';
import { formatTimestampToUTC } from './utils';
import { subscribeToCurrentTime, setCurrentTime } from './stateManager';
import { subscribeToRealTime, setIsRealTime } from './stateManager';

export function getQueryParams() {
    const queryParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(queryParams.entries());
}

export function updateQueryParams(key, value) {
    const queryParams = new URLSearchParams(window.location.search);
    if (value === null) {
        queryParams.delete(key);
    } else {
        queryParams.set(key, value);
    }
    history.replaceState(null, '', `?${queryParams.toString()}`);
}

export function initializeURLHandler(map) {

    map.on('moveend', () => {
        const center = map.getView().getCenter();
        const zoom = map.getView().getZoom();
        const lonLat = toLonLat(center);
        updateQueryParams('lon', lonLat[0].toFixed(2)); // Longitude
        updateQueryParams('lat', lonLat[1].toFixed(2)); // Latitude
        updateQueryParams('zoom', zoom.toFixed(2)); // Zoom level
    });

    subscribeToCurrentTime((currentTime) => {
        const timestamp = formatTimestampToUTC(currentTime);
        updateQueryParams('timestamp', timestamp);
    });
    subscribeToRealTime((isRealTime) => {
        if (isRealTime) {
            updateQueryParams('realtime', '1');
            updateQueryParams('timestamp', null);
        } else {
            updateQueryParams('realtime', null);
        }
    });

    const queryParams = getQueryParams();
    if (queryParams.timestamp) {
        // Ensure that realtime is removed
        setIsRealTime(false);
        updateQueryParams('realtime', null);
        const year = parseInt(queryParams.timestamp.slice(0, 4), 10);
        const month = parseInt(queryParams.timestamp.slice(4, 6), 10) - 1;
        const day = parseInt(queryParams.timestamp.slice(6, 8), 10);
        const hours = parseInt(queryParams.timestamp.slice(8, 10), 10);
        const minutes = parseInt(queryParams.timestamp.slice(10, 12), 10);
        setCurrentTime(new Date(Date.UTC(year, month, day, hours, minutes)));
    } else {
        setIsRealTime(true);
    }
    if (queryParams.center) {
        const [lon, lat] = queryParams.center.split(',').map(Number);
        map.getView().setCenter(fromLonLat([lon, lat]));
    }
    if (queryParams.zoom) {
        map.getView().setZoom(Number(queryParams.zoom));
    }
}
