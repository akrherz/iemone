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

document.addEventListener('DOMContentLoaded', () => {
    // The state manager should already be initialized by this point
    // So now we can inspect the URL to see what it says
    initializeURLHandler();

    // map will push lat,lon,zoom to state
    const map = initializeMap();
    const radarTMSLayer = createRadarTMSLayer(map);
    const tableElement = document.getElementById('warnings-table');
    const spsLayer = createSPSLayer(map);
    const warningsLayer = createWarningsLayer(map, tableElement);

    // Setup UI components that depend on state
    setupTimeInputControl();
    setupWarningsTable(tableElement, warningsLayer);
    setupWarningsModal();
    setupLayerControls(radarTMSLayer, spsLayer);
    setupHelpModal();
    initBrandingOverlay();
});