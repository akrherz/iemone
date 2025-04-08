import { fromLonLat } from 'ol/proj';

export function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        timestamp: params.get('timestamp'),
        center: params.get('center'),
        zoom: params.get('zoom'),
        realtime: params.get('realtime')
    };
}

export function updateURL(map, currentTime) {
    const center = map.getView().getCenter();
    const zoom = map.getView().getZoom();
    const queryParams = new URLSearchParams(window.location.search);

    queryParams.set('timestamp', currentTime.toISOString());
    queryParams.set('center', center ? fromLonLat(center).map(coord => coord.toFixed(2)).join(',') : '');
    queryParams.set('zoom', zoom ? zoom.toFixed(2) : '');
    history.replaceState(null, '', `?${queryParams.toString()}`);
}
