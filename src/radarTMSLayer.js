import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { formatTimestampToUTC, rectifyToFiveMinutes } from './utils';
import { getCurrentTime, subscribeToCurrentTime } from './stateManager';

const SERVICE = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/";
let radarTMSLayer = null;

function createRadarSource(timestamp) {
    // Always rectify the timestamp for radar requests
    const rectifiedTime = rectifyToFiveMinutes(timestamp);
    const formattedTimestamp = formatTimestampToUTC(rectifiedTime);
    return new XYZ({
        url: `${SERVICE}ridge::USCOMP-N0Q-${formattedTimestamp}/{z}/{x}/{y}.png`,
        crossOrigin: 'anonymous'
    });
}

export function createRadarTMSLayer(map) {
    const time = getCurrentTime();
    radarTMSLayer = new TileLayer({
        source: createRadarSource(time),
        visible: true
    });
    map.addLayer(radarTMSLayer);

    // Subscribe to time changes
    subscribeToCurrentTime((currentTime) => {
        radarTMSLayer.setSource(createRadarSource(currentTime));
    });

    return radarTMSLayer;
}

export function updateRadarTMSLayer(time) {
    if (radarTMSLayer) {
        const source = createRadarSource(time);
        radarTMSLayer.setSource(source);
    }
}
