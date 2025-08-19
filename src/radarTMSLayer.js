import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { formatTimestampToUTC, rectifyToFiveMinutes } from './utils';
import { getCurrentTime, subscribeToCurrentTime } from './state';

const SERVICE = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/";
let radarTMSLayer = null;

/**
 * 
 * @param {Date} time 
 * @returns 
 */
function getRadarURL(time) {
    // Always rectify the timestamp for radar requests
    const rectifiedTime = rectifyToFiveMinutes(time);
    const formattedTimestamp = formatTimestampToUTC(rectifiedTime);
    const prod = (rectifiedTime.getFullYear() < 2011) ? 'N0R' : 'N0Q';
    return `${SERVICE}ridge::USCOMP-${prod}-${formattedTimestamp}/{z}/{x}/{y}.png`;
}

export function createRadarTMSLayer(map) {
    const time = getCurrentTime();
    const url = getRadarURL(time);
    radarTMSLayer = new TileLayer({
        source: new XYZ({
            url,
            crossOrigin: 'anonymous'
        }),
        visible: true
    });
    map.addLayer(radarTMSLayer);

    // Subscribe to time changes
    subscribeToCurrentTime((currentTime) => {
        radarTMSLayer.getSource().setUrl(getRadarURL(currentTime));
    });

    return radarTMSLayer;
}

export function updateRadarTMSLayer(time) {
    if (radarTMSLayer) {
        radarTMSLayer.getSource().setUrl(getRadarURL(time));
    }
}

export function resetRadarTMSLayer() {
    if (radarTMSLayer) {
        radarTMSLayer.getSource().setUrl(getRadarURL(getCurrentTime()));
    }
}
