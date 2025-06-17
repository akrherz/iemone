import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke, Style } from 'ol/style';
import strftime from 'strftime';
import { showToaster } from './toaster';
import { formatTimestampToUTC } from './utils';
import {
    subscribeToCurrentTime,
    getCurrentTime,
    saveState,
    getActivePhenomena,
    toggleActivePhenomenon,
    getLayerVisibility,
    setLayerVisibility,
} from './state';
import { requireInputElement } from 'iemjs/domUtils';

let warningsLayer = null;
const colorLookup = {
    'TO.W': '#FF0000', // Red
    'SV.W': '#FFA500', // Orange
    'FF.W': '#8B0000', // Dark Red
    'FL.W': '#00FF00', // Green
    'MA.W': '#FFA500', // Orange
    'DS.W': '#FFE4C4', // Bisque
    'SQ.W': '#C71585', // Medium Violet Red
    'EW.W': '#FF00FF', // Magenta
    'FL.Y': '#00FF7F', // Spring Green
    'FA.Y': '#00FF7F', // Spring Green
    'DS.Y': '#BDB76B', // Dark Khaki
};

/**
 * Get the url for the warnings GeoJSON based on the time.
 * @param {*} time
 * @returns {string} The URL for the warnings GeoJSON.
 */
function getWarningURL(time) {
    const timestamp = time.toISOString();
    return `https://mesonet.agron.iastate.edu/geojson/sbw.py?ts=${timestamp}`;
}

function formatTimestamp(date) {
    return strftime('%Y-%m-%d %H:%M', date);
}

export function getActivePhenomenaSignificance() {
    return getActivePhenomena();
}

export function createWarningPopup(feature, popupElement) {
    const issueUTC = new Date(feature.get('issue'));
    const expireUTC = new Date(feature.get('expire_utc'));

    const issueLocal = formatTimestamp(issueUTC);
    const expireLocal = formatTimestamp(expireUTC);

    popupElement.innerHTML = `
        <strong>WFO:</strong> ${feature.get('wfo')}<br>
        <strong>Event:</strong> ${feature.get('ps')} ${feature.get(
        'eventid'
    )}<br>
        <strong>Issue:</strong> ${issueLocal} (${issueUTC
        .toISOString()
        .slice(11, 16)} UTC)<br>
        <strong>Expires:</strong> ${expireLocal} (${expireUTC
        .toISOString()
        .slice(11, 16)} UTC)<br>
        <a href="${feature.get('href')}" target="_new">VTEC App Link</a>
    `;
    return true;
}

export function createWarningsLayer(map, tableElement) {
    const geojsonSource = new VectorSource({
        format: new GeoJSON(),
        url: () => getWarningURL(getCurrentTime()),
    });

    warningsLayer = new VectorLayer({
        source: geojsonSource,
        style: (feature) => {
            const phenomena = feature.get('phenomena');
            const significance = feature.get('significance');
            const key = `${phenomena}.${significance}`;

            if (!getActivePhenomena().has(key)) {
                return [];
            }

            const color = colorLookup[key] || 'gray';
            return [
                // Outer black stroke
                new Style({
                    stroke: new Stroke({
                        color: '#000000',
                        width: 5,
                    }),
                }),
                // Inner colored stroke
                new Style({
                    stroke: new Stroke({
                        color,
                        width: 3,
                    }),
                }),
            ];
        },
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
        stopEvent: true,
    });
    map.addOverlay(popupOverlay);

    map.on('singleclick', (event) => {
        const features = map.getFeaturesAtPixel(event.pixel);
        if (features && features.length > 0) {
            const feature = features[0];
            const phenomena = feature.get('phenomena');
            if (phenomena) {
                // Only handle warning features
                if (createWarningPopup(feature, popupElement)) {
                    popupElement.style.display = 'block';
                    popupOverlay.setPosition(event.coordinate);
                }
            }
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

            phenomenaSignificanceCounts[key] =
                (phenomenaSignificanceCounts[key] || 0) + 1;

            if (!getActivePhenomena().has(key)) {
                return;
            }

            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = feature.get('wfo');
            row.appendChild(cell);
            const cell3 = document.createElement('td');
            const expireUTC = new Date(feature.get('expire_utc'));
            const expireLocal = formatTimestamp(expireUTC);
            cell3.textContent = `${expireLocal} (${expireUTC
                .toISOString()
                .slice(11, 16)} UTC)`;
            row.appendChild(cell3);
            const cell4 = document.createElement('td');
            cell4.innerHTML = `<a href="${feature.get(
                'href'
            )}" target="_new">${key} ${feature.get('eventid')}</a>`;
            row.appendChild(cell4);
            tbody.appendChild(row);
        });

        const phenomenaToggles = document.querySelectorAll('.phenomena-toggle');
        phenomenaToggles.forEach((toggle) => {
            if (toggle instanceof HTMLButtonElement) {
                const key = toggle.dataset.key;
                if (key) {
                    const count = phenomenaSignificanceCounts[key] || 0;
                    const countBadge = toggle.querySelector('.count');
                    if (countBadge instanceof HTMLElement) {
                        countBadge.textContent = count;
                        countBadge.style.display = count > 0 ? 'block' : 'none';
                    }
                }
            }
        });
    }

    geojsonSource.on('change', () => {
        if (geojsonSource.getState() === 'ready') {
            const features = geojsonSource.getFeatures();
            updateTableAndCounts(features);
        }
    });

    const warningsLayerToggle = requireInputElement('toggle-warnings-layer');
    
    // Initialize from unified state (URL → localStorage → HTML default)
    warningsLayerToggle.checked = getLayerVisibility('warnings');
    warningsLayer.setVisible(warningsLayerToggle.checked);
    
    warningsLayerToggle.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            warningsLayer.setVisible(target.checked);
            setLayerVisibility('warnings', target.checked);
        }
        saveState();
    });

    const phenomenaToggles = document.querySelectorAll('.phenomena-toggle');
    phenomenaToggles.forEach((toggle) => {
        if (!(toggle instanceof HTMLButtonElement)) {
            return;
        }
        const key = toggle.dataset.key;

        // Initialize toggle button state based on active phenomena
        if (!getActivePhenomena().has(key)) {
            toggle.classList.remove('active');
            toggle.style.background = '#ccc';
        } else {
            toggle.classList.add('active');
            toggle.style.background = colorLookup[key] || '';
        }

        toggle.addEventListener('click', (event) => {
            const isActive = toggleActivePhenomenon(key);
            const target = event.target;
            if (!(target instanceof HTMLButtonElement)) {
                return;
            }
            target.classList.toggle('active', isActive);
            target.style.background = isActive
                ? colorLookup[key] || ''
                : '#ccc';
            warningsLayer.changed();
            saveState();
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
