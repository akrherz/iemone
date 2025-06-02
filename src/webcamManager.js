// Webcam Manager for stuff
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon } from 'ol/style';
import { Overlay } from 'ol';
import { requireElement } from './domUtils.js';
import { getState, StateKeys } from './state.js';
import { GeoJSON } from 'ol/format';
import { WebcamWindow } from './webcamWindow.js';
import { webcamRegistry } from './webcamRegistry.js';

/**
 * @typedef {Object} WebcamFeatureProperties
 * @property {string} cid - Camera identifier (e.g., "ISUC-006")
 * @property {string} url - Image URL for the webcam
 * @property {string} name - Human-readable camera name/location
 * @property {string} county - County name or identifier
 * @property {string} state - State name or identifier
 * @property {string} valid - ISO timestamp of last image update
 * @property {number} [angle] - Camera angle in degrees (0-360)
 */

/**
 * @typedef {Object} DashcamFeatureProperties
 * @property {string} cid - Camera identifier
 * @property {string} imgurl - Image URL for the dashcam
 * @property {string} utc_valid - ISO timestamp of last image update
 */

/**
 * @typedef {Object} RWISFeatureProperties
 * @property {string} cid - Camera identifier
 * @property {string} imgurl1 - Image URL for the RWIS camera
 * @property {string} imgurl2 - Image URL for the RWIS camera
 * @property {string} imgurl3 - Image URL for the RWIS camera
 * @property {string} imgurl4 - Image URL for the RWIS camera
 * @property {string} imgurl5 - Image URL for the RWIS camera
 * @property {string} imgurl6 - Image URL for the RWIS camera
 * @property {string} imgurl7 - Image URL for the RWIS camera
 * @property {string} imgurl8 - Image URL for the RWIS camera
 * @property {string} imgurl9 - Image URL for the RWIS camera
 * @property {string} utc_valid - ISO timestamp of last image update
 */

let webcamGeoJsonLayer = null;
let idotdashcamGeoJsonLayer = null;
let idotRWISLayer = null;
let currentCameraFeature = null;
let element = null;
let popup = null;

const cameraStyle = new Style({
    image: new Icon({
        src: 'https://mesonet.agron.iastate.edu/images/yellow_arrow.png'
    })
});
const trackaplowStyle = new Style({
    image: new Icon({
        src: 'https://mesonet.agron.iastate.edu/images/trackaplow.png',
        scale: 0.4
    })
});
const trackaplowStyle2 = new Style({
    image: new Icon({
        src: 'https://mesonet.agron.iastate.edu/images/trackaplow_red.png',
        scale: 0.6
    })
});
const rwisStyle = new Style({
    image: new Icon({
        src: 'https://mesonet.agron.iastate.edu/images/rwiscam.svg',
        scale: 0.6
    })
});
const cameraStyle2 = new Style({
    image: new Icon({
        src: 'https://mesonet.agron.iastate.edu/images/red_arrow.png',
        scale: 1.2
    })
});

/**
 * Refresh GeoJSON data from all webcam services
 * Loads data from:
 * - Webcams: Returns WebcamFeatureProperties
 * - IDOT Dashcams: Returns DashcamFeatureProperties  
 * - IDOT RWIS: Returns RWISFeatureProperties
 * 
 */
export function refreshJSON() {
    // Check if layers are initialized before refreshing
    if (!webcamGeoJsonLayer || !idotdashcamGeoJsonLayer || !idotRWISLayer) {
        console.warn('WebcamManager: Layers not yet initialized, skipping refresh');
        return;
    }
    
    let url = "https://mesonet.agron.iastate.edu/geojson/webcam.geojson?network=TV";
    const realtimeMode = getState(StateKeys.IS_REALTIME);
    const currentTime = getState(StateKeys.CURRENT_TIME);
    if (!realtimeMode) {
        // Append the current timestamp to the URI
        url += `&valid=${currentTime.toISOString()}`;
    }
    let newsource = new VectorSource({
        url,
        format: new GeoJSON()
    });
    webcamGeoJsonLayer.setSource(newsource);

    // Dashcam
    url = "https://mesonet.agron.iastate.edu/api/1/idot_dashcam.geojson";
    if (!realtimeMode) {
        // Append the current timestamp to the URI
        url += `?valid=${currentTime.toISOString()}`;
    }
    newsource = new VectorSource({
        url,
        format: new GeoJSON()
    });
    idotdashcamGeoJsonLayer.setSource(newsource);

    // RWIS
    url = "https://mesonet.agron.iastate.edu/api/1/idot_rwiscam.geojson";
    if (!realtimeMode) {
        // Append the current timestamp to the URI
        url += `?valid=${currentTime.toISOString()}`;
    }
    newsource = new VectorSource({
        url,
        format: new GeoJSON()
    });
    idotRWISLayer.setSource(newsource);
}

export function getWebcamLayers() {
    return {
        webcamGeoJsonLayer,
        idotdashcamGeoJsonLayer,
        idotRWISLayer
    };
}

/**
 * Initialize the webcam manager
 * @param {*} map - The OpenLayers map instance
 * 
 * Sets up vector layers for displaying webcam features with properties:
 * - WebcamFeatureProperties for standard webcams
 * - DashcamFeatureProperties for IDOT truck dashcams
 * - RWISFeatureProperties for IDOT RWIS stations
 * 
 * @see {@link file://docs/geojson-apis.md} for feature property specifications
 */
export function initializeWebcam(map) {
    // TODO: liveshot button for webcams that support it


    idotdashcamGeoJsonLayer = new VectorLayer({
        // @ts-ignore
        title: 'Iowa DOT Truck Dashcams (2014-)',
        source: new VectorSource({
            url: 'https://mesonet.agron.iastate.edu/api/1/idot_dashcam.geojson',
            format: new GeoJSON()
        }),
        style: (feature) => {
            if (currentCameraFeature &&
                currentCameraFeature.get("cid") === feature.get("cid")) {
                currentCameraFeature = feature;
                return [trackaplowStyle2];
            }
            return [trackaplowStyle];
        }
    });
    idotRWISLayer = new VectorLayer({
        // @ts-ignore
        title: 'Iowa DOT RWIS Webcams (2010-)',
        source: new VectorSource({
            url: 'https://mesonet.agron.iastate.edu/api/1/idot_rwiscam.geojson',
            format: new GeoJSON()
        }),
        style(feature) {
            if (currentCameraFeature &&
                currentCameraFeature.get("cid") === feature.get("cid")) {
                currentCameraFeature = feature;
                return [rwisStyle];
            }
            return [rwisStyle];
        }
    });
    webcamGeoJsonLayer = new VectorLayer({
        // @ts-ignore
        title: 'Webcams (2003-)',
        source: new VectorSource({
            url: 'https://mesonet.agron.iastate.edu/geojson/webcam.geojson?network=TV',
            format: new GeoJSON()
        }),
        style: (feature) => {
            if (currentCameraFeature &&
                currentCameraFeature.get("cid") === feature.get("cid")) {
                currentCameraFeature = feature;
                // OL rotation is in radians!
                cameraStyle2.getImage()?.setRotation(
                    parseInt(feature.get('angle'), 10) / 180.0 * 3.14);
                return [cameraStyle2];
            }
            cameraStyle.getImage()?.setRotation(
                parseInt(feature.get('angle'), 10) / 180.0 * 3.14);
            return [cameraStyle];
        }
    });
    map.addLayer(webcamGeoJsonLayer);
    map.addLayer(idotdashcamGeoJsonLayer);
    map.addLayer(idotRWISLayer);

    // Register layers with webcamRegistry for data monitoring
    webcamRegistry.registerLayer(webcamGeoJsonLayer);
    webcamRegistry.registerLayer(idotdashcamGeoJsonLayer);
    webcamRegistry.registerLayer(idotRWISLayer);

    element = requireElement('popup');

    popup = new Overlay({
        element,
        positioning: 'bottom-center',
        stopEvent: false
    });
    map.addOverlay(popup);


    map.on('click', (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (ft) => ft);
        if (!feature) {
            return;
        }
        // All webcam features must have a camera identifier
        if (feature.get("cid") === undefined){
            return;
        }
        // Remove styling
        if (currentCameraFeature) {
            currentCameraFeature.setStyle(feature.getStyle());
        }
        // Update
        currentCameraFeature = feature;
        // Set new styling - angle property is optional for webcams
        if (feature.get("angle") !== undefined) {
            cameraStyle2.getImage()?.setRotation(
                parseInt(feature.get('angle'), 10) / 180.0 * 3.14);
            feature.setStyle(cameraStyle2);
        }
        
        // Check if this is an RWIS camera with multiple views
        const rwisViews = {};
        for (let i = 1; i <= 9; i++) {
            const imgurl = feature.get(`imgurl${i}`);
            if (imgurl) {
                rwisViews[`View ${i}`] = imgurl;
            }
        }
        
        // Create window with appropriate configuration
        const windowOptions = {
            cid: feature.get('cid'),
            title: feature.get('name') || feature.get('cid') || 'Camera View',
            description: `Camera ID: ${feature.get('cid')}`, 
            timestamp: feature.get('utc_valid') || feature.get('valid'),
        };
        
        // Add view support for RWIS cameras
        if (Object.keys(rwisViews).length > 0) {
            windowOptions.views = rwisViews;
            windowOptions.src = Object.values(rwisViews)[0]; // Default to first view
            windowOptions.title = `RWIS: ${windowOptions.title} (${Object.keys(rwisViews).length} views)`;
        } else {
            windowOptions.src = feature.get('imgurl') || feature.get("url");
        }
        
        new WebcamWindow(windowOptions);
    });
    refreshJSON();


};
