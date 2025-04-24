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
import { loadState } from './statePersistence';

document.addEventListener('DOMContentLoaded', () => {
    const map = initializeMap();
    const warningsTable = document.getElementById('warnings-table');
    const savedState = loadState();

    if (savedState) {
        // Initialize UI elements with saved state
        const tmsOpacitySlider = document.getElementById('tms-opacity-slider');
        const tmsLayerToggle = document.getElementById('toggle-tms-layer');
        if (tmsOpacitySlider) {
            tmsOpacitySlider.value = savedState.radarOpacity;
        }
        if (tmsLayerToggle) {
            tmsLayerToggle.checked = savedState.radarVisible;
        }
    }

    const radarTMSLayer = createRadarTMSLayer(map);
    const warningsLayer = createWarningsLayer(map, warningsTable, savedState);

    initBrandingOverlay();

    setupWarningsTable(warningsTable, warningsLayer);
    setupWarningsModal();
    setupTimeInputControl();

    setupLayerControls(radarTMSLayer);

    initializeURLHandler(map);
});