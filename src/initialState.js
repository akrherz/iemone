import { loadState, setCurrentTime, setState, StateKeys, setLayerVisibility } from './state';

function getQueryParams() {
    const queryParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(queryParams.entries());
}

// Apply non-conflicting values from localStorage after URL has been applied.
export function applyLocalStorageFallbackToState() {
    const params = getQueryParams();
    try {
        const lstate = loadState();
        if (!lstate) {
            return;
        }

        const applied = [];

        // timestamp / realtime: only apply when URL didn't specify
        if (!params.timestamp && lstate.currentTime && !lstate.isRealtime) {
            setCurrentTime(lstate.currentTime);
            applied.push('timestamp');
        }

        // lat/lon/zoom
        if (!params.lon && typeof lstate.longitude === 'number') {
            setState(StateKeys.LON, parseFloat(lstate.longitude));
            applied.push('lon');
        }
        if (!params.lat && typeof lstate.latitude === 'number') {
            setState(StateKeys.LAT, parseFloat(lstate.latitude));
            applied.push('lat');
        }
        if (!params.zoom && typeof lstate.zoom === 'number') {
            setState(StateKeys.ZOOM, parseFloat(lstate.zoom));
            applied.push('zoom');
        }

        // layer visibility
        const layerParams = ['radar', 'warnings', 'sps', 'webcam', 'dashcam', 'rwis', 'rwisobs'];
        layerParams.forEach(layer => {
            if (params[layer] === undefined && lstate.layerVisibility && lstate.layerVisibility[layer] !== undefined) {
                setLayerVisibility(layer, !!lstate.layerVisibility[layer]);
                applied.push(layer);
            }
        });

        // RWIS label attribute: apply only if URL didn't provide it
        if (!params.rwisobs_label && lstate.rwisobsLabel) {
            setState(StateKeys.RWIS_LABEL, lstate.rwisobsLabel);
            applied.push('rwisobs_label');
        }

        // If any applied, we rely on state subscribers to update the URL accordingly.
        return applied.length > 0;
    } catch (err) {
        console.warn('Failed to apply localStorage bootstrap:', err);
        return false;
    }
}
