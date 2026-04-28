import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Text, Fill, Stroke } from 'ol/style';
import { formatTimestampToUTC } from './utils';
import {
    getCurrentTime,
    getIsRealTime,
    getState,
    setState,
    StateKeys,
    subscribeToCurrentTime,
} from './state';

const RADAR_API = 'https://mesonet.agron.iastate.edu/json/radar.py';
const RADAR_API2 = 'https://mesonet.agron.iastate.edu/json/radar';
const TILE_SERVICE =
    'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const ANIMATION_FRAMES = 12;
const PREFERRED_PRODUCTS = ['TZL', 'N0B', 'N0Q', 'N0R'];

let ridgeTileLayer = null;
let ridgeStationsLayer = null;
let stationsSource = null;

/** @type {Array<{ts: string}>} */
let currentScans = [];
let currentScanTs = null;
let currentScansDate = null;
let refreshInterval = null;

const callbacks = {
    radarSelected: [],
    productsLoaded: [],
    scansUpdated: [],
    radarsLoaded: [],
};

function fireCallbacks(type, data) {
    (callbacks[type] || []).forEach((cb) => cb(data));
}

export function onRadarStationClick(cb) {
    callbacks.radarSelected.push(cb);
}

export function onProductsLoaded(cb) {
    callbacks.productsLoaded.push(cb);
}

export function onScansUpdated(cb) {
    callbacks.scansUpdated.push(cb);
}

export function onRadarsLoaded(cb) {
    callbacks.radarsLoaded.push(cb);
}

export function buildTileUrl(radar, product, ts) {
    const date = new Date(ts);
    const formatted = formatTimestampToUTC(date);
    return `${TILE_SERVICE}ridge::${radar}-${product}-${formatted}/{z}/{x}/{y}.png`;
}

export function findClosestScan(scans, targetTime) {
    if (!scans || scans.length === 0) {return null;}
    let closest = scans[0];
    let minDiff = Math.abs(new Date(scans[0].ts).getTime() - targetTime.getTime());
    for (const scan of scans) {
        const diff = Math.abs(new Date(scan.ts).getTime() - targetTime.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closest = scan;
        }
    }
    return closest;
}

function getStationStyle(selectedRadarId) {
    return (feature) => {
        const radarId = feature.get('radarId');
        const isSelected = radarId === selectedRadarId;
        return new Style({
            text: new Text({
                text: radarId,
                font: `${isSelected ? 'bold ' : ''}12px Arial, sans-serif`,
                fill: new Fill({ color: isSelected ? '#ffff00' : '#ffffff' }),
                backgroundFill: new Fill({ color: isSelected ? '#1a5c1a' : '#2e8b2e' }),
                backgroundStroke: new Stroke({ color: '#0a3a0a', width: 1 }),
                padding: [2, 4, 2, 4],
            }),
        });
    };
}

async function fetchAvailableRadars(time) {
    const iso = time.toISOString().slice(0, 19) + 'Z';
    const res = await fetch(`${RADAR_API}?operation=available&start=${iso}`);
    if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
    return res.json();
}

async function fetchProducts(radar, time) {
    const iso = time.toISOString().slice(0, 19) + 'Z';
    const res = await fetch(
        `${RADAR_API2}?radar=${radar}&start=${iso}&operation=products`
    );
    if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
    return res.json();
}

async function fetchScans(radar, product, time) {
    const start = new Date(time);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const startStr = `${start.toISOString().slice(0, 16)}Z`;
    const endStr = `${end.toISOString().slice(0, 16)}Z`;
    const res = await fetch(
        `${RADAR_API2}?operation=list&product=${product}&radar=${radar}&start=${startStr}&end=${endStr}`
    );
    if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
    return res.json();
}

function refreshStationStyle() {
    if (!stationsSource) {return;}
    const selectedRadar = getState(StateKeys.RIDGE_RADAR);
    const styleFn = getStationStyle(selectedRadar);
    stationsSource.getFeatures().forEach((feature) => feature.setStyle(styleFn(feature)));
}

function applyClosestScanToLayer() {
    const radar = getState(StateKeys.RIDGE_RADAR);
    const product = getState(StateKeys.RIDGE_PRODUCT);
    if (!radar || !product || currentScans.length === 0) {return;}

    const scan = findClosestScan(currentScans, getCurrentTime());
    if (!scan) {return;}

    currentScanTs = scan.ts;
    ridgeTileLayer.getSource().setUrl(buildTileUrl(radar, product, scan.ts));
    ridgeTileLayer.setVisible(true);
    fireCallbacks('scansUpdated', { scans: currentScans, currentScan: scan.ts });
}

export async function loadAvailableRadars() {
    try {
        const data = await fetchAvailableRadars(getCurrentTime());
        if (!data.radars || !stationsSource) {return;}

        const selectedRadar = getState(StateKeys.RIDGE_RADAR);
        const styleFn = getStationStyle(selectedRadar);
        const radars = data.radars.filter((radar) => radar.id !== 'USCOMP');
        const features = radars.map((radar) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([radar.lon, radar.lat])),
                radarId: radar.id,
                radarName: radar.name,
            });
            feature.setId(radar.id);
            feature.setStyle(styleFn(feature));
            return feature;
        });

        stationsSource.clear();
        stationsSource.addFeatures(features);
        fireCallbacks('radarsLoaded', { radars });
    } catch (err) {
        console.error('Failed to load available RADARs:', err);
    }
}

export async function selectRadar(radarId) {
    setState(StateKeys.RIDGE_RADAR, radarId);
    refreshStationStyle();
    fireCallbacks('radarSelected', { radarId });

    try {
        const data = await fetchProducts(radarId, getCurrentTime());
        if (data.products) {
            fireCallbacks('productsLoaded', { products: data.products });

            const currentProduct = getState(StateKeys.RIDGE_PRODUCT);
            const productExists =
                currentProduct && data.products.some((prod) => prod.id === currentProduct);
            if (!productExists && data.products.length > 0) {
                const preferred = PREFERRED_PRODUCTS.find((id) =>
                    data.products.some((prod) => prod.id === id)
                );
                await selectProduct(preferred ?? data.products[0].id);
            } else if (productExists) {
                await loadScansAndUpdate();
            }
        }
    } catch (err) {
        console.error('Failed to load RADAR products:', err);
    }
}

async function loadScansAndUpdate() {
    const radar = getState(StateKeys.RIDGE_RADAR);
    const product = getState(StateKeys.RIDGE_PRODUCT);
    if (!radar || !product) {return;}

    try {
        const data = await fetchScans(radar, product, getCurrentTime());
        currentScans = data.scans || [];
        currentScansDate = getCurrentTime().toISOString().slice(0, 10);
        applyClosestScanToLayer();
    } catch (err) {
        console.error('Failed to load RADAR scans:', err);
    }
}

export async function selectProduct(product) {
    setState(StateKeys.RIDGE_PRODUCT, product);
    await loadScansAndUpdate();
}

export function updateRidgeForTime(time) {
    const radar = getState(StateKeys.RIDGE_RADAR);
    const product = getState(StateKeys.RIDGE_PRODUCT);
    if (!radar || !product || currentScans.length === 0) {return;}

    const scan = findClosestScan(currentScans, time);
    if (!scan) {return;}

    currentScanTs = scan.ts;
    ridgeTileLayer.getSource().setUrl(buildTileUrl(radar, product, scan.ts));
    fireCallbacks('scansUpdated', { scans: currentScans, currentScan: scan.ts });
}

export function getRidgeScansForAnimation(count = ANIMATION_FRAMES) {
    if (currentScans.length === 0) {return [];}
    return currentScans.slice(-count);
}

export function getCurrentRidgeScanTime() {
    return currentScanTs;
}

export function isRidgeActive() {
    if (!ridgeTileLayer) {return false;}
    return (
        ridgeTileLayer.getVisible() &&
        !!getState(StateKeys.RIDGE_RADAR) &&
        !!getState(StateKeys.RIDGE_PRODUCT)
    );
}

export function getRidgeTileLayer() {
    return ridgeTileLayer;
}

export function getRidgeStationsLayer() {
    return ridgeStationsLayer;
}

function startRealtimeRefresh() {
    stopRealtimeRefresh();
    refreshInterval = setInterval(async () => {
        await loadAvailableRadars();
        const radar = getState(StateKeys.RIDGE_RADAR);
        const product = getState(StateKeys.RIDGE_PRODUCT);
        if (radar && product) {
            await loadScansAndUpdate();
        }
    }, REFRESH_INTERVAL_MS);
}

function stopRealtimeRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

export function createRidgeRadarLayers(map) {
    ridgeTileLayer = new TileLayer({
        source: new XYZ({
            url: `${TILE_SERVICE}ridge::DMX-N0Q-202001010000/{z}/{x}/{y}.png`,
            crossOrigin: 'anonymous',
        }),
        visible: false,
        opacity: 1,
    });

    stationsSource = new VectorSource();
    ridgeStationsLayer = new VectorLayer({
        source: stationsSource,
        visible: false,
        zIndex: 1002,
    });

    map.addLayer(ridgeTileLayer);
    map.addLayer(ridgeStationsLayer);

    map.on('singleclick', (event) => {
        if (!ridgeStationsLayer.getVisible()) {return;}
        const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => {
            if (feat.get('radarId') !== undefined) {return feat;}
            return undefined;
        });
        if (feature) {
            selectRadar(feature.get('radarId'));
        }
    });

    subscribeToCurrentTime((newTime) => {
        if (!isRidgeActive()) {return;}
        if (getIsRealTime()) {
            if (currentScans.length > 0) {
                applyClosestScanToLayer();
            }
        } else {
            const newDateStr = newTime.toISOString().slice(0, 10);
            if (currentScans.length > 0 && newDateStr === currentScansDate) {
                updateRidgeForTime(newTime);
            } else {
                loadScansAndUpdate();
            }
        }
    });

    if (getIsRealTime()) {
        startRealtimeRefresh();
    }

    return { tileLayer: ridgeTileLayer, stationsLayer: ridgeStationsLayer };
}

export function setRidgeEnabled(enabled) {
    if (!ridgeStationsLayer || !ridgeTileLayer) {return;}
    ridgeStationsLayer.setVisible(enabled);

    if (enabled) {
        loadAvailableRadars();
        const radar = getState(StateKeys.RIDGE_RADAR);
        const product = getState(StateKeys.RIDGE_PRODUCT);
        if (radar && product) {
            loadScansAndUpdate();
        } else if (radar) {
            selectRadar(radar);
        }
        if (getIsRealTime()) {
            startRealtimeRefresh();
        }
    } else {
        ridgeTileLayer.setVisible(false);
        stopRealtimeRefresh();
    }
}
