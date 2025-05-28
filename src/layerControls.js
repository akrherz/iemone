import { saveState } from './state';
import { requireElement, requireInputElement } from './domUtils.js';

function saveLayerState() {
    saveState();
}

export function setupLayerControls(radarTMSLayer, spsLayer) {
    const layersToggle = requireElement('layers-toggle');
    const layerControl = requireElement('layer-control');
    const closeLayersButton = requireElement('close-layers');

    layersToggle.addEventListener('click', () => {
        layerControl.classList.toggle('open');
    });

    closeLayersButton.addEventListener('click', () => {
        layerControl.classList.remove('open');
    });

    const tmsLayerToggle = requireInputElement('toggle-tms-layer');
    const tmsOpacitySlider = requireInputElement('tms-opacity-slider');
    const spsLayerToggle = requireInputElement('toggle-sps-layer');

    tmsLayerToggle.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            radarTMSLayer.setVisible(target.checked);
        }
        saveLayerState();
    });

    // Initialize the TMS layer visibility
    radarTMSLayer.setVisible(tmsLayerToggle.checked);

    spsLayerToggle.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            spsLayer.setVisible(target.checked);
        }
        saveLayerState();
    });

    // Initialize the SPS layer visibility
    spsLayer.setVisible(spsLayerToggle.checked);

    tmsOpacitySlider.addEventListener('input', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            radarTMSLayer.setOpacity(parseFloat(target.value));
        }
        saveLayerState();
    });

    // Initialize the TMS layer opacity
    radarTMSLayer.setOpacity(parseFloat(tmsOpacitySlider.value));
}
