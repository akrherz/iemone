import { saveState } from './state';

function saveLayerState() {
    saveState();
}

export function setupLayerControls(radarTMSLayer, spsLayer) {
    const layersToggle = document.getElementById('layers-toggle');
    const layerControl = document.getElementById('layer-control');
    const closeLayersButton = document.getElementById('close-layers');

    if (layersToggle && layerControl) {
        layersToggle.addEventListener('click', () => {
            layerControl.classList.toggle('open');
        });

        // Add close button functionality
        if (closeLayersButton) {
            closeLayersButton.addEventListener('click', () => {
                layerControl.classList.remove('open');
            });
        }
    }

    const tmsLayerToggle = document.getElementById('toggle-tms-layer');
    const tmsOpacitySlider = document.getElementById('tms-opacity-slider');
    const spsLayerToggle = document.getElementById('toggle-sps-layer');

    if (tmsLayerToggle) {
        tmsLayerToggle.addEventListener('change', (event) => {
            radarTMSLayer.setVisible(event.target.checked);
            saveLayerState();
        });

        // Initialize the TMS layer visibility
        radarTMSLayer.setVisible(tmsLayerToggle.checked);
    }

    if (spsLayerToggle) {
        spsLayerToggle.addEventListener('change', (event) => {
            spsLayer.setVisible(event.target.checked);
            saveLayerState();
        });

        // Initialize the SPS layer visibility
        spsLayer.setVisible(spsLayerToggle.checked);
    }

    if (tmsOpacitySlider) {
        tmsOpacitySlider.addEventListener('input', (event) => {
            radarTMSLayer.setOpacity(parseFloat(event.target.value));
            saveLayerState();
        });

        // Initialize the TMS layer opacity
        radarTMSLayer.setOpacity(parseFloat(tmsOpacitySlider.value));
    }
}
