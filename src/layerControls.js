import { saveState, getLayerVisibility, setLayerVisibility, getState, setState, StateKeys } from './state';
import { requireElement, requireInputElement } from 'iemjs/domUtils';
import { getWebcamLayers } from './webcamManager.js';

function saveLayerState() {
    saveState();
}

export function setupLayerControls(map, radarTMSLayer, spsLayer) {
    const layersToggle = requireElement('layers-toggle');
    const layerControl = requireElement('layer-control');
    const closeLayersButton = requireElement('close-layers');

    layersToggle.addEventListener('click', () => {
        layerControl.classList.toggle('open');
    });

    closeLayersButton.addEventListener('click', () => {
        layerControl.classList.remove('open');
    });

    // Setup base layer control
    const baseLayerSelect = requireElement('base-layer-select');
    
    // Initialize from state
    baseLayerSelect.value = getState(StateKeys.BASE_LAYER);
    
    baseLayerSelect.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && map.baseLayerManager) {
            const selectedBaseLayer = target.value;
            map.baseLayerManager.setBaseLayers(map, selectedBaseLayer);
            setState(StateKeys.BASE_LAYER, selectedBaseLayer);
            saveState();
        }
    });

    // Setup radar layer control with unified system
    const tmsLayerToggle = requireInputElement('toggle-tms-layer');
    const tmsOpacitySlider = requireInputElement('tms-opacity-slider');
    
    // Initialize from state (URL → localStorage → HTML default)
    tmsLayerToggle.checked = getLayerVisibility('radar');
    radarTMSLayer.setVisible(tmsLayerToggle.checked);
    
    tmsLayerToggle.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            radarTMSLayer.setVisible(target.checked);
            setLayerVisibility('radar', target.checked);
        }
        saveLayerState();
    });

    // Setup SPS layer control with unified system
    const spsLayerToggle = requireInputElement('toggle-sps-layer');
    
    // Initialize from state
    spsLayerToggle.checked = getLayerVisibility('sps');
    spsLayer.setVisible(spsLayerToggle.checked);

    spsLayerToggle.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            spsLayer.setVisible(target.checked);
            setLayerVisibility('sps', target.checked);
        }
        saveLayerState();
    });

    tmsOpacitySlider.addEventListener('input', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            radarTMSLayer.setOpacity(parseFloat(target.value));
        }
        saveLayerState();
    });

    // Initialize the TMS layer opacity
    radarTMSLayer.setOpacity(parseFloat(tmsOpacitySlider.value));

    // Setup webcam layer controls with unified system
    const webcamLayers = getWebcamLayers();
    
    if (webcamLayers.webcamGeoJsonLayer) {
        const webcamLayerToggle = requireInputElement('toggle-webcam-layer');
        
        // Initialize from state
        webcamLayerToggle.checked = getLayerVisibility('webcam');
        webcamLayers.webcamGeoJsonLayer.setVisible(webcamLayerToggle.checked);
        
        webcamLayerToggle.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                webcamLayers.webcamGeoJsonLayer.setVisible(target.checked);
                setLayerVisibility('webcam', target.checked);
            }
            saveLayerState();
        });
    }
    
    if (webcamLayers.idotdashcamGeoJsonLayer) {
        const dashcamLayerToggle = requireInputElement('toggle-dashcam-layer');
        
        // Initialize from state
        dashcamLayerToggle.checked = getLayerVisibility('dashcam');
        webcamLayers.idotdashcamGeoJsonLayer.setVisible(dashcamLayerToggle.checked);
        
        dashcamLayerToggle.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                webcamLayers.idotdashcamGeoJsonLayer.setVisible(target.checked);
                setLayerVisibility('dashcam', target.checked);
            }
            saveLayerState();
        });
    }
    
    if (webcamLayers.idotRWISLayer) {
        const rwisLayerToggle = requireInputElement('toggle-rwis-layer');
        
        // Initialize from state
        rwisLayerToggle.checked = getLayerVisibility('rwis');
        webcamLayers.idotRWISLayer.setVisible(rwisLayerToggle.checked);
        
        rwisLayerToggle.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                webcamLayers.idotRWISLayer.setVisible(target.checked);
                setLayerVisibility('rwis', target.checked);
            }
            saveLayerState();
        });
    }
}
