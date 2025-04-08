import Map from 'ol/Map';
import { OSM } from 'ol/source';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import Tile from 'ol/layer/Tile';

export function initializeMap() {
    return new Map({
        target: 'map',
        layers: [
            new Tile({
                source: new OSM()
            })
        ],
        view: new View({
            center: fromLonLat([-98.5795, 39.8283]),
            zoom: 4
        })
    });
}
