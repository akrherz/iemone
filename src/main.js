import './style.css';
import { initializeMap } from './map';
import { createWarningsLayer } from './warningsLayer';
import { createSPSLayer } from './spsLayer';
import { setupWarningsTable } from './warningsTable';
import { createRadarTMSLayer } from './radarTMSLayer';
import { initializeURLHandler } from './urlHandler';
import { setupWarningsModal } from './warningsModal';
import { setupTimeInputControl } from './timeInputControl';
import { setupLayerControls } from './layerControls';
import { initBrandingOverlay } from './brandingOverlay';
import { setupHelpModal } from './helpModal';
import { initializeWebcam } from './webcamManager';
import { requireElement } from 'iemjs/domUtils';
import { createRwisLayer } from './pointObservations';

document.addEventListener('DOMContentLoaded', () => {
    initializeURLHandler();

    // Create shared popup element for layers that need it
    const sharedPopup = document.createElement('div');
    sharedPopup.id = 'popup';
    sharedPopup.style.display = 'none';
    document.body.appendChild(sharedPopup);

    const map = initializeMap();
    const radarTMSLayer = createRadarTMSLayer(map);
    // Create RWIS observations layer (clustered)
    const rwisLayer = createRwisLayer(map, { defaultUrl: 'https://mesonet.agron.iastate.edu/api/1/rwis.geojson', cluster: true });
    const tableElement = requireElement('warnings-table');
    const spsLayer = createSPSLayer(map);
    const warningsLayer = createWarningsLayer(map, tableElement);
    initializeWebcam(map);

    // Setup UI components that depend on state
    setupTimeInputControl();
    setupWarningsTable(tableElement, warningsLayer);
    setupWarningsModal();
    setupLayerControls(map, radarTMSLayer, spsLayer, rwisLayer);
    setupHelpModal();
    initBrandingOverlay();
});