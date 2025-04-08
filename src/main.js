import './style.css';
import { initializeMap } from './map';
import { createWarningsLayer } from './warningsLayer';
import { setupWarningsTable } from './warningsTable';
import { createRadarTMSLayer } from './radarTMSLayer';
import { initializeURLHandler } from './urlHandler';
import { setupWarningsModal } from './warningsModal';
import { setupTimeInputControl } from './timeInputControl';
import { setupLayerControls } from './layerControls';
import { initBrandingOverlay } from './brandingOverlay';

document.addEventListener('DOMContentLoaded', () => {
    const map = initializeMap();
    const warningsTable = document.getElementById('warnings-table');

    const radarTMSLayer = createRadarTMSLayer(map);
    const warningsLayer = createWarningsLayer(map, warningsTable);

    initBrandingOverlay();

    setupWarningsTable(warningsTable, warningsLayer);
    setupWarningsModal();
    setupTimeInputControl();

    setupLayerControls(radarTMSLayer);

    initializeURLHandler(map);
});