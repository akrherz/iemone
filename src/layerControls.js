
export function setupLayerControls(radarTMSLayer) {
    const layersToggle = document.getElementById('layers-toggle');
    const layerControl = document.getElementById('layer-control');

    if (layersToggle && layerControl) {
        layersToggle.addEventListener('click', () => {
            layerControl.classList.toggle('open'); // Toggle the `open` class
        });
    }
    const tmsLayerToggle = document.getElementById('toggle-tms-layer');
    const tmsOpacitySlider = document.getElementById('tms-opacity-slider');

    if (tmsLayerToggle) {
        tmsLayerToggle.addEventListener('change', (event) => {
            if (event.target.checked) {
                // Enable the TMS layer
                radarTMSLayer.setVisible(true);
            } else {
                // Disable the TMS layer
                radarTMSLayer.setVisible(false);
            }
        });

        // Initialize the TMS layer visibility
        radarTMSLayer.setVisible(tmsLayerToggle.checked);
    }

    if (tmsOpacitySlider) {
        tmsOpacitySlider.addEventListener('input', (event) => {
            radarTMSLayer.setOpacity(parseFloat(event.target.value));
        });

        // Initialize the TMS layer opacity
        radarTMSLayer.setOpacity(parseFloat(tmsOpacitySlider.value));
    }
}
