import Map from 'ol/Map';
import { OSM } from 'ol/source';
import View from 'ol/View';
import { toLonLat, fromLonLat } from 'ol/proj';
import Tile from 'ol/layer/Tile';
import { getState, setState, StateKeys } from './stateManager';

export function initializeMap() {
    const defaultCenter = [getState(StateKeys.LON), getState(StateKeys.LAT)];
    const defaultZoom = getState(StateKeys.ZOOM);

    const viewCenter = fromLonLat(defaultCenter);

    const view = new View({
        center: viewCenter,
        zoom: defaultZoom,
        constrainResolution: true,
        maxZoom: 16,
        minZoom: 2
    });

    const map = new Map({
        target: 'map',
        layers: [
            new Tile({
                source: new OSM()
            })
        ],
        view
    });

    map.on('moveend', () => {
        const center = map.getView().getCenter();
        const lonLat = toLonLat(center);
        const zoom = view.getZoom();

        setState(StateKeys.LON, lonLat[0]);
        setState(StateKeys.LAT, lonLat[1]);
        setState(StateKeys.ZOOM, zoom);
    });
    return map;
}
