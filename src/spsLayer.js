import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style } from 'ol/style';
import strftime from 'strftime';
import { showToaster } from './toaster';
import { formatTimestampToUTC } from './utils';
import { subscribeToCurrentTime, getCurrentTime } from './state';

let spsLayer = null;
let popupOverlay = null;

/**
 * Get the url for the SPS GeoJSON based on the time.
 * @param {*} time
 * @returns {string} The URL for the SPS GeoJSON.
 */
function getSPSURL(time) {
    const timestamp = time.toISOString();
    return `https:///mesonet.agron.iastate.edu/geojson/sps.py?valid=${timestamp}`;
}

export function createSPSPopup(feature, popupElement) {
    const issueUTC = new Date(feature.get('issue'));
    const expireUTC = new Date(feature.get('expire'));

    const issueLocal = formatTimestamp(issueUTC);
    const expireLocal = formatTimestamp(expireUTC);

    popupElement.innerHTML = `
        <strong>WFO:</strong> ${feature.get('wfo')}<br>
        <strong>Event:</strong> Special Weather Statement<br>
        <strong>Issue:</strong> ${issueLocal} (${issueUTC.toISOString().slice(11, 16)} UTC)<br>
        <strong>Expires:</strong> ${expireLocal} (${expireUTC.toISOString().slice(11, 16)} UTC)<br>
        <a href="${feature.get('href')}" target="_new">View Full Statement</a>
    `;
    return true;
}

export function createSPSLayer(map) {
    const geojsonSource = new VectorSource({
        format: new GeoJSON(),
        url: () => getSPSURL(getCurrentTime())
    });

    spsLayer = new VectorLayer({
        source: geojsonSource,
        visible: true,
        style: new Style({
            stroke: new Stroke({
                color: '#000000',
                width: 3
            }),
            fill: null
        })
    });

    map.addLayer(spsLayer);

    const popupElement = document.createElement('div');
    popupElement.id = 'sps-popup';
    popupElement.style.position = 'absolute';
    popupElement.style.background = 'white';
    popupElement.style.border = '1px solid black';
    popupElement.style.padding = '10px';
    popupElement.style.display = 'none';
    popupElement.style.zIndex = '1000';
    popupElement.style.width = '300px';
    popupElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    document.body.appendChild(popupElement);

    popupOverlay = new Overlay({
        element: popupElement,
        positioning: 'bottom-center',
        stopEvent: true
    });
    map.addOverlay(popupOverlay);

    map.on('singleclick', (event) => {
        const features = map.getFeaturesAtPixel(event.pixel);
        if (features && features.length > 0) {
            const feature = features[0];
            if (feature.get('segmentnum') !== undefined) {  // Only handle SPS features
                createSPSPopup(feature, popupElement);
                popupElement.style.display = 'block';
                popupOverlay.setPosition(event.coordinate);
            }
        } else {
            popupElement.style.display = 'none';
        }
    });

    subscribeToCurrentTime((newTime) => {
        updateSPSLayer(newTime);
    });

    return spsLayer;
}

export function getSPSLayer() {
    return spsLayer;
}

export function updateSPSLayer(time) {
    if (spsLayer) {
        const timestamp = formatTimestampToUTC(time);
        showToaster(`Special Weather Statements for ${timestamp} loading!`);
        const source = spsLayer.getSource();
        source.setUrl(getSPSURL(time));
        source.refresh();
    }
}

function formatTimestamp(date) {
    return strftime('%Y-%m-%d %H:%M', date);
}