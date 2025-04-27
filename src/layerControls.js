import { saveState } from './statePersistence';

function saveLayerState() {
    saveState({
        radarVisible: document.getElementById('toggle-tms-layer')?.checked,
        radarOpacity: document.getElementById('tms-opacity-slider')?.value,
        warningsVisible: document.getElementById('toggle-warnings-layer')?.checked,
        activePhenomena: new Set(Array.from(document.querySelectorAll('.phenomena-checkbox:checked')).map(cb => cb.value))
    });
}

export function setupLayerControls(radarTMSLayer) {
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

    if (tmsLayerToggle) {
        tmsLayerToggle.addEventListener('change', (event) => {
            radarTMSLayer.setVisible(event.target.checked);
            saveLayerState();
        });

        // Initialize the TMS layer visibility
        radarTMSLayer.setVisible(tmsLayerToggle.checked);
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
