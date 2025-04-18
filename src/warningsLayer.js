import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style } from 'ol/style';

import { showToaster } from './toaster';
import { formatTimestampToUTC } from './utils';
import { subscribeToCurrentTime, getCurrentTime } from './stateManager';

let warningsLayer = null;

/**
 * Get the url for the warnings GeoJSON based on the time.
 * @param {*} time
 * @returns {string} The URL for the warnings GeoJSON.
 */
function getWarningURL(time) {
    const timestamp = time.toISOString();
    return `https://mesonet.agron.iastate.edu/geojson/sbw.py?ts=${timestamp}`;

}

export function createWarningsLayer(map, tableElement) {
    const colorLookup = {
        "FL.A": "#2E8B57",
        "MA.W": "#FFA500",
        "FL.W": "#00FF00",
        "FF.W": "#8B0000",
        "SV.W": "#FFA500",
        "DS.Y": "#BDB76B",
        "FL.Y": "#00FF7F",
        "DS.W": "#FFE4C4",
        "FA.A": "#2E8B57",
        "FA.W": "#00FF00",
        "SQ.W": "#C71585",
        "TO.W": "#FF0000",
        "FA.Y": "#00FF7F"
    };

    const activePhenomenaSignificance = new Set(["TO.W", "SV.W", "FF.W", "EW.W", "SQ.W", "DS.W"]);

    const geojsonSource = new VectorSource({
        format: new GeoJSON(),
        url: () => getWarningURL(getCurrentTime())
    });

    warningsLayer = new VectorLayer({
        source: geojsonSource,
        style: (feature) => {
            const phenomena = feature.get('phenomena');
            const significance = feature.get('significance');
            const key = `${phenomena}.${significance}`;

            if (!activePhenomenaSignificance.has(key)) {
                return null;
            }

            const color = colorLookup[key] || 'gray';
            return new Style({
                stroke: new Stroke({
                    color,
                    width: 3
                })
            });
        }
    });

    map.addLayer(warningsLayer);

    const popupElement = document.createElement('div');
    popupElement.id = 'popup';
    popupElement.style.position = 'absolute';
    popupElement.style.background = 'white';
    popupElement.style.border = '1px solid black';
    popupElement.style.padding = '10px';
    popupElement.style.display = 'none';
    popupElement.style.zIndex = '1000';
    popupElement.style.width = '300px';
    popupElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    document.body.appendChild(popupElement);

    const popupOverlay = new Overlay({
        element: popupElement,
        positioning: 'bottom-center',
        stopEvent: true
    });
    map.addOverlay(popupOverlay);

    function formatTimestamp(date) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        };
        return date.toLocaleString(undefined, options);
    }

    map.on('singleclick', (event) => {
        const features = map.getFeaturesAtPixel(event.pixel);
        if (features && features.length > 0) {
            const feature = features[0];
            const issueUTC = new Date(feature.get('issue'));
            const expireUTC = new Date(feature.get('expire_utc'));

            const issueLocal = formatTimestamp(issueUTC);
            const expireLocal = formatTimestamp(expireUTC);

            popupElement.innerHTML = `
                <strong>WFO:</strong> ${feature.get('wfo')}<br>
                <strong>Event:</strong> ${feature.get('ps')} ${feature.get('eventid')}<br>
                <strong>Issue:</strong> ${issueLocal} (${issueUTC.toISOString().slice(11, 16)} UTC)<br>
                <strong>Expires:</strong> ${expireLocal} (${expireUTC.toISOString().slice(11, 16)} UTC)<br>
                <a href="${feature.get('href')}" target="_new">VTEC App Link</a>
            `;
            popupElement.style.display = 'block';
            popupOverlay.setPosition(event.coordinate);
        } else {
            popupElement.style.display = 'none';
        }
    });

    function updateTableAndCounts(features) {
        const tbody = tableElement.querySelector('tbody');
        tbody.innerHTML = '';

        const phenomenaSignificanceCounts = {};

        features.forEach((feature) => {
            const phenomena = feature.get('phenomena');
            const significance = feature.get('significance');
            const key = `${phenomena}.${significance}`;

            phenomenaSignificanceCounts[key] = (phenomenaSignificanceCounts[key] || 0) + 1;

            if (!activePhenomenaSignificance.has(key)) {
                return;
            }

            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = feature.get('wfo');
            row.appendChild(cell);
            const cell3 = document.createElement('td');
            const expireUTC = new Date(feature.get('expire_utc'));
            const expireLocal = formatTimestamp(expireUTC);
            cell3.textContent = `${expireLocal} (${expireUTC.toISOString().slice(11, 16)} UTC)`;
            row.appendChild(cell3);
            const cell4 = document.createElement('td');
            cell4.innerHTML = `<a href="${feature.get('href')}" target="_new">${key} ${feature.get('eventid')}</a>`;
            row.appendChild(cell4);
            tbody.appendChild(row);
        });

        const phenomenaToggles = document.querySelectorAll('.phenomena-toggle');
        phenomenaToggles.forEach((toggle) => {
            const key = toggle.dataset.key;
            if (key) {
                const count = phenomenaSignificanceCounts[key] || 0;
                toggle.textContent = `${key} (${count})`;
            }
        });
    }

    geojsonSource.on('change', () => {
        if (geojsonSource.getState() === 'ready') {
            const features = geojsonSource.getFeatures();
            updateTableAndCounts(features);
        }
    });

    const warningsLayerToggle = document.getElementById('toggle-warnings-layer');
    if (warningsLayerToggle) {
        warningsLayerToggle.addEventListener('change', (event) => {
            warningsLayer.setVisible(event.target.checked);
        });
    }

    const phenomenaToggles = document.querySelectorAll('.phenomena-toggle');
    phenomenaToggles.forEach((toggle) => {
        const key = toggle.dataset.key;

        if (key === "FL.W") {
            toggle.classList.remove('active');
        }

        toggle.addEventListener('click', (event) => {
            if (activePhenomenaSignificance.has(key)) {
                activePhenomenaSignificance.delete(key);
                event.target.classList.remove('active');
                event.target.style.background = '#ccc';
            } else {
                activePhenomenaSignificance.add(key);
                event.target.classList.add('active');
                event.target.style.background = colorLookup[key] || '';
            }
            warningsLayer.changed();
        });
    });

    subscribeToCurrentTime((newTime) => {
        updateWarningsLayer(newTime);
    });

    return warningsLayer;
}

export function getWarningsLayer() {
    return warningsLayer;
}

export function updateWarningsLayer(time) {
    if (warningsLayer) {
        const timestamp = formatTimestampToUTC(time);
        showToaster(`Warnings for ${timestamp} loading!`);
        const source = warningsLayer.getSource();
        source.setUrl(getWarningURL(time));
        source.refresh();
    }
}