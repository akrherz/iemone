import Map from 'ol/Map';
import View from 'ol/View';
import { toLonLat, fromLonLat } from 'ol/proj';
import { getState, setState, StateKeys, saveState } from './state';
import { BaseLayerManager } from './baseLayerManager';

export function initializeMap() {
    const defaultCenter = [getState(StateKeys.LON), getState(StateKeys.LAT)];
    const defaultZoom = getState(StateKeys.ZOOM);
    const selectedBaseLayer = getState(StateKeys.BASE_LAYER);

    const viewCenter = fromLonLat(defaultCenter);

    const view = new View({
        center: viewCenter,
        zoom: defaultZoom,
        constrainResolution: true,
        maxZoom: 16,
        minZoom: 2
    });

    const baseLayerManager = new BaseLayerManager();
    const baseLayers = baseLayerManager.createBaseLayers(selectedBaseLayer);
    
    // Store the current base layers in the manager
    baseLayerManager.currentBaseLayers = baseLayers;

    const map = new Map({
        target: 'map',
        layers: baseLayers,
        view
    });

    map.on('moveend', () => {
        const center = map.getView().getCenter();
        if (!center) {
            return;
        }
        const lonLat = toLonLat(center);
        const zoom = view.getZoom();

        setState(StateKeys.LON, lonLat[0]);
        setState(StateKeys.LAT, lonLat[1]);
        setState(StateKeys.ZOOM, zoom);
        saveState();
    });

    // Store the base layer manager on the map for later access
    map.baseLayerManager = baseLayerManager;
    
    return map;
}
