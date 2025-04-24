import Tile from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { formatTimestampToUTC, rectifyToFiveMinutes } from './utils';
import { getCurrentTime, subscribeToCurrentTime } from './stateManager';
import { updateRadarTime } from './brandingOverlay';

const SERVICE = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/";
let radarTMSLayer = null;

export function createRadarTMSLayer(map) {
    const time = rectifyToFiveMinutes(getCurrentTime());
    const stamp = formatTimestampToUTC(time);
    radarTMSLayer = new Tile({
        source: new XYZ({
            url: `${SERVICE}ridge::USCOMP-N0Q-${stamp}/{z}/{x}/{y}.png`,
            crossOrigin: 'anonymous'
        }),
        visible: true
    });
    map.addLayer(radarTMSLayer);
    updateRadarTime(time);

    subscribeToCurrentTime((currenttime) => {
        updateRadarTMSLayer(rectifyToFiveMinutes(currenttime));
    });

    return radarTMSLayer;
}

export function updateRadarTMSLayer(time) {
    if (radarTMSLayer) {
        const timestamp = formatTimestampToUTC(time);
        const new_url = `${SERVICE}ridge::USCOMP-N0Q-${timestamp}/{z}/{x}/{y}.png`;
        const current_url = radarTMSLayer.getSource().getUrls()[0];
        if (current_url !== new_url) {
            radarTMSLayer.getSource().setUrl(new_url);
            updateRadarTime(time);
        }
    }
}
