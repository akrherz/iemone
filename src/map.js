import Map from 'ol/Map';
import { XYZ } from 'ol/source';
import View from 'ol/View';
import { toLonLat, fromLonLat } from 'ol/proj';
import Tile from 'ol/layer/Tile';
import { getState, setState, StateKeys, saveState } from './state';

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

    const baseLayer = new Tile({
        source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })
    });

    const referenceLayer = new Tile({
        source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            attributions: 'Tiles © Esri'
        }),
        opacity: 0.8,
        zIndex: 1000
    });

    const transportationLayer = new Tile({
        source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            attributions: 'Tiles © Esri'
        }),
        opacity: 0.7,
        zIndex: 1001
    });

    const map = new Map({
        target: 'map',
        layers: [baseLayer, referenceLayer, transportationLayer],
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
    return map;
}
