import XYZ from 'ol/source/XYZ';
import Tile from 'ol/layer/Tile';

export const BASE_LAYER_CONFIGS = {
    'openstreetmap': {
        id: 'openstreetmap',
        name: 'OpenStreetMap',
        description: 'Standard OpenStreetMap tiles',
        layers: () => [
            {
                source: new XYZ({
                    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    attributions: '© OpenStreetMap contributors'
                })
            }
        ]
    },
    'esri-hybrid': {
        id: 'esri-hybrid',
        name: 'ESRI Satellite + Labels',
        description: 'ESRI satellite imagery with boundaries and transportation',
        layers: () => [
            {
                source: new XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                })
            },
            {
                source: new XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Tiles © Esri'
                }),
                opacity: 0.8,
                zIndex: 1000
            },
            {
                source: new XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Tiles © Esri'
                }),
                opacity: 0.7,
                zIndex: 1001
            }
        ]
    },
    'esri-satellite': {
        id: 'esri-satellite',
        name: 'ESRI Satellite Only',
        description: 'Clean satellite imagery without labels',
        layers: () => [
            {
                source: new XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                })
            }
        ]
    },
    'esri-topo': {
        id: 'esri-topo',
        name: 'ESRI Topographic',
        description: 'Detailed topographic map',
        layers: () => [
            {
                source: new XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
                    attributions: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                })
            }
        ]
    },
    'cartodb-dark': {
        id: 'cartodb-dark',
        name: 'CartoDB Dark',
        description: 'Dark theme map ideal for radar visualization',
        layers: () => [
            {
                source: new XYZ({
                    url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{retina}.png',
                    attributions: '© OpenStreetMap contributors © CARTO'
                })
            }
        ]
    },
    'cartodb-light': {
        id: 'cartodb-light',
        name: 'CartoDB Light',
        description: 'Light, clean map style',
        layers: () => [
            {
                source: new XYZ({
                    url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{retina}.png',
                    attributions: '© OpenStreetMap contributors © CARTO'
                })
            }
        ]
    }
};

export class BaseLayerManager {
    constructor() {
        this.currentBaseLayers = [];
    }

    createBaseLayers(baseLayerId) {
        const config = BASE_LAYER_CONFIGS[baseLayerId];
        if (!config) {
            console.warn(`Unknown base layer: ${baseLayerId}, falling back to esri-hybrid`);
            return this.createBaseLayers('esri-hybrid');
        }

        const layerConfigs = typeof config.layers === 'function' ? config.layers() : config.layers;
        return layerConfigs.map(layerConfig => {
            const layer = new Tile(layerConfig);
            return layer;
        });
    }

    setBaseLayers(map, baseLayerId) {
        this.removeCurrentBaseLayers(map);
        this.currentBaseLayers = this.createBaseLayers(baseLayerId);
        
        // Insert base layers at the beginning
        this.currentBaseLayers.forEach((layer, index) => {
            map.getLayers().insertAt(index, layer);
        });
    }

    removeCurrentBaseLayers(map) {
        this.currentBaseLayers.forEach(layer => {
            map.removeLayer(layer);
        });
        this.currentBaseLayers = [];
    }

    getBaseLayerOptions() {
        return Object.values(BASE_LAYER_CONFIGS).map(config => ({
            id: config.id,
            name: config.name,
            description: config.description
        }));
    }
}
