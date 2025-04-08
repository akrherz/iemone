import Tile from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

export function createRadarTMSLayer(map, currentTime) {
    const radarTMSLayer = new Tile({
        source: new XYZ({
            url: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::USCOMP-N0Q-${formatTimestamp(currentTime)}/{z}/{x}/{y}.png`,
            crossOrigin: 'anonymous'
        }),
        visible: true
    });
    map.addLayer(radarTMSLayer);
    return radarTMSLayer;
}

export function updateRadarTMSLayer(radarTMSLayer, radarTime) {
    const timestamp = formatTimestamp(radarTime);
    radarTMSLayer.getSource().setUrl(`https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::USCOMP-N0Q-${timestamp}/{z}/{x}/{y}.png`);
}

function formatTimestamp(date) {
    const year = date.getUTCFullYear().toString();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
}
