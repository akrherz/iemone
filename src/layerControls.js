import { saveState } from './state';
import { requireElement, requireInputElement } from './domUtils.js';
import { getWebcamLayers } from './webcamManager.js';

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

    // Setup webcam layer controls
    const webcamLayers = getWebcamLayers();
    
    if (webcamLayers.webcamGeoJsonLayer) {
        const webcamLayerToggle = requireInputElement('toggle-webcam-layer');
        webcamLayerToggle.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                webcamLayers.webcamGeoJsonLayer.setVisible(target.checked);
            }
            saveLayerState();
        });
        webcamLayers.webcamGeoJsonLayer.setVisible(webcamLayerToggle.checked);
    }
    
    if (webcamLayers.idotdashcamGeoJsonLayer) {
        const dashcamLayerToggle = requireInputElement('toggle-dashcam-layer');
        dashcamLayerToggle.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                webcamLayers.idotdashcamGeoJsonLayer.setVisible(target.checked);
            }
            saveLayerState();
        });
        webcamLayers.idotdashcamGeoJsonLayer.setVisible(dashcamLayerToggle.checked);
    }
    
    if (webcamLayers.idotRWISLayer) {
        const rwisLayerToggle = requireInputElement('toggle-rwis-layer');
        rwisLayerToggle.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                webcamLayers.idotRWISLayer.setVisible(target.checked);
            }
            saveLayerState();
        });
        webcamLayers.idotRWISLayer.setVisible(rwisLayerToggle.checked);
    }
}
