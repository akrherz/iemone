import { saveState } from './statePersistence';

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
            saveState({
                radarVisible: event.target.checked,
                radarOpacity: parseFloat(tmsOpacitySlider.value),
                warningsVisible: document.getElementById('toggle-warnings-layer').checked,
                activePhenomena: window.activePhenomenaSignificance,
                isRealTime: window.isRealTime
            });
        });

        // Initialize the TMS layer visibility
        radarTMSLayer.setVisible(tmsLayerToggle.checked);
    }

    if (tmsOpacitySlider) {
        tmsOpacitySlider.addEventListener('input', (event) => {
            radarTMSLayer.setOpacity(parseFloat(event.target.value));
            saveState({
                radarVisible: tmsLayerToggle.checked,
                radarOpacity: parseFloat(event.target.value),
                warningsVisible: document.getElementById('toggle-warnings-layer').checked,
                activePhenomena: window.activePhenomenaSignificance,
                isRealTime: window.isRealTime
            });
        });

        // Initialize the TMS layer opacity
        radarTMSLayer.setOpacity(parseFloat(tmsOpacitySlider.value));
    }
}
