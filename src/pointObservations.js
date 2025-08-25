import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon } from 'ol/style';
import { GeoJSON } from 'ol/format';
import Overlay from 'ol/Overlay';
import { getLayerVisibility, subscribeToCurrentTime, getIsRealTime, getCurrentTime } from './state.js';

const labelAttributeDefault = 'tmpf';
const layerInstances = new WeakMap();

// Use a small inline SVG icon so the style works in tests (Icon is mocked) and
// in the browser it renders a simple circle marker.
const svg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="#0088cc" stroke="#ffffff"/></svg>'
);
const defaultStyle = new Style({
    image: new Icon({
        src: `data:image/svg+xml;utf8,${svg}`,
        scale: 1
    })
});

export function createPointObservationsLayer(map, options = {}) {
    const url = options.url || options.defaultUrl || null;
    const baseSource = new VectorSource({ url, format: new GeoJSON() });
    const layer = new VectorLayer({
        // @ts-ignore
        title: options.title || 'Point Observations',
        source: baseSource,
        style: defaultStyle,
        visible: options.visible ?? false
    });
    
    // Store layer-specific state using WeakMap
    layerInstances.set(layer, {
        labelAttribute: labelAttributeDefault,
        overlay: null,
        popupElement: null
    });
    
    if (map) {
        map.addLayer(layer);
    }
    return layer;
}

export function refreshPointObservations(layer, url) {
    if (!layer) {
        return;
    }
    let src = layer.getSource();
    if (!src) {
        return;
    }
    // If cluster source, unwrap to the underlying vector source
    if (src.getSource && typeof src.getSource === 'function') {
        src = src.getSource();
    }
    if (!src) {
        return;
    }
    if (url) {
        src.setUrl(url);
    }
    if (src.refresh) {
        src.refresh();
    }
}

export function getLayerInstance(layer) {
    return layerInstances.get(layer);
}

// Test helper: allow tests to inject layer state
export function __setTestLayerState(layer, state) {
    layerInstances.set(layer, state);
}

export function setLabelAttribute(layer, attr) {
    if (!attr || !layer) {
        return;
    }
    const instance = layerInstances.get(layer);
    if (!instance) {
        return;
    }
        
    instance.labelAttribute = attr;
    
    
    // Force a style refresh if the layer exists
    if (layer && layer.changed) {
        layer.changed();
        // Also force the source to refresh to ensure style updates
        const source = layer.getSource();
        if (source && source.changed) {
            source.changed();
        }
    }
}

export function getLabelAttribute(layer) {
    if (!layer) {
        return labelAttributeDefault;
    }
    const instance = layerInstances.get(layer);
    return instance ? instance.labelAttribute : labelAttributeDefault;
}

// Helper: create an SVG icon with a numeric label and color
function createLabeledSVG(text, color) {
    // Use black text for white/light backgrounds, white text for dark backgrounds
    const textColor = color === '#ffffff' ? '#000000' : '#ffffff';
    const svgg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="18"><rect rx="3" ry="3" width="28" height="18" fill="${color}"/><text x="14" y="13" font-size="10" font-family="sans-serif" fill="${textColor}" text-anchor="middle">${text}</text></svg>`
    );
    return `data:image/svg+xml;utf8,${svgg}`;
}

// Helper: create an SVG circle without label
function createUnlabeledCircle(color) {
    const svgg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="${color}" stroke="#ffffff" stroke-width="1"/></svg>`
    );
    return `data:image/svg+xml;utf8,${svgg}`;
}

// Color scale for RWIS temperature in F focused on freezing conditions
function tmpfColorScale(val) {
    if (val === null || val === undefined || Number.isNaN(val)) {
        return '#999999';
    }
    const vv = Math.round(val);
    if (vv < 30) {
        return '#ffffff';  // white
    }
    if (vv < 31) {
        return '#800080';  // purple
    }
    if (vv < 32) {
        return '#dda0dd';  // light purple
    }
    if (vv < 33) {
        return '#ff0000';  // red
    }
    if (vv < 34) {
        return '#ffa500';  // orange
    }
    if (vv < 35) {
        return '#32cd32';  // lime green
    }
    return '#008000';  // green
}

/**
 * Create an RWIS observations layer (specialized point layer)
 * options: { defaultUrl, title, cluster: boolean }
 */
export function createRwisLayer(map, options = {}) {
    const defaultUrl = options.defaultUrl || 'https://mesonet.agron.iastate.edu/api/1/rwis.geojson';
    
    // Get initial visibility from state system
    const initialVisible = getLayerVisibility('rwisobs');
    
    // Create base layer without clustering, use state for initial visibility
    const layer = createPointObservationsLayer(map, { 
        defaultUrl, 
        title: options.title || 'RWIS Observations', 
        cluster: false,
        visible: initialVisible
    });

    // Replace style with zoom-aware styling
    const styleFunction = (feature) => {
        const props = feature.getProperties ? feature.getProperties() : {};
        // Get the current labelAttribute value dynamically from this layer's instance
        const currentAttr = getLabelAttribute(layer);
        const val = props[currentAttr];
        // Use the selected attribute's value for both color and label
        const color = tmpfColorScale(val);
        
        // Get current zoom level from the map
        const zoom = map ? map.getView().getZoom() : 0;
        
        // Show unlabeled circles until zoom level 7, then show labels
        if (zoom < 7) {
            const src = createUnlabeledCircle(color);
            return new Style({ image: new Icon({ src, scale: 1 }) });
        } else {
            const label = (val === null || val === undefined || Number.isNaN(val)) ? '---' : String(Math.round(val));
            const src = createLabeledSVG(label, color);
            return new Style({ image: new Icon({ src, scale: 1 }) });
        }
    };
    
    layer.setStyle(styleFunction);

    // Listen for zoom changes to update styling
    if (map) {
        map.getView().on('change:resolution', () => {
            layer.changed();
        });
    }

    // Popup handling: create our own dedicated popup element for RWIS
    const popupEl = document.createElement('div');
    popupEl.id = `rwis-popup-${Date.now()}`; // Make ID unique for multiple instances
    popupEl.style.cssText = `
        position: absolute;
        background: rgba(255,255,255,0.95);
        color: #333;
        padding: 0;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 1px solid rgba(0,0,0,0.2);
        z-index: 2005;
        min-width: 400px;
        display: none;
        line-height: 1.4;
    `;
    document.body.appendChild(popupEl);

    // Store popup element in layer instance
    const instance = layerInstances.get(layer);
    if (instance) {
        instance.popupElement = popupEl;
    }

    let overlay = null;
    if (popupEl && map) {
        try {
            overlay = new Overlay({ element: popupEl, positioning: 'bottom-center', stopEvent: false });
            map.addOverlay(overlay);
            if (instance) {
                instance.overlay = overlay;
            }
        } catch (err) {
            console.error('Failed to create RWIS overlay:', err);
            overlay = null;
        }
    }

    // Click handler to show properties
    if (map) {
        map.on('click', (evt) => {
            
            // Find RWIS features specifically by checking if they come from our layer
            const feature = map.forEachFeatureAtPixel(evt.pixel, (ft, layerRef) => {
                // Only handle features from our RWIS layer
                if (layerRef === layer) {
                    return ft;
                }
                return null;
            });
                        
            if (!feature) {
                // hide popup if present
                if (popupEl) {
                    popupEl.style.display = 'none';
                }
                if (overlay && typeof overlay.setPosition === 'function') {
                    overlay.setPosition(undefined);
                }
                return;
            }
            const props = feature.getProperties ? feature.getProperties() : {};
            
            // Helper function to format values
            const formatValue = (val, suffix = '') => {
                if (val === null || val === undefined || val === '') {
                    return '--';
                }
                return `${val}${suffix}`;
            };
            
            // Helper function to format temperature
            const formatTemp = (val) => {
                if (val === null || val === undefined || Number.isNaN(val)) {
                    return '--';
                }
                return `${Math.round(val)}°F`;
            };
            
            // Format timestamps
            let localTime = '--';
            let utcTime = '--';
            if (props.local_valid) {
                try {
                    // local_valid is already in local timezone, just format it nicely
                    // Parse as if it were UTC to avoid timezone conversion, then format
                    const parts = props.local_valid.split('T');
                    const datePart = parts[0];
                    const timePart = parts[1] || '00:00:00';
                    const [year, month, day] = datePart.split('-');
                    const [hour, minute] = timePart.split(':');
                    const dd = new Date(year, month - 1, day, hour, minute);
                    localTime = dd.toLocaleString();
                } catch {
                    localTime = props.local_valid;
                }
            }
            if (props.utc_valid) {
                try {
                    const dd = new Date(props.utc_valid);
                    const hours = dd.getUTCHours().toString().padStart(2, '0');
                    const minutes = dd.getUTCMinutes().toString().padStart(2, '0');
                    utcTime = `(${hours}${minutes} UTC)`;
                } catch {
                    utcTime = props.utc_valid;
                }
            }
            
            // Build RWIS-specific popup content
            const name = formatValue(props.name);
            const station = formatValue(props.station);
            const tmpf = formatTemp(props.tmpf);
            const dwpf = formatTemp(props.dwpf);
            const feel = formatTemp(props.feel);
            const relh = formatValue(props.relh, '%');
            
            const tfs0 = formatTemp(props.tfs0);
            const tfs0_text = formatValue(props.tfs0_text);
            const tfs1 = formatTemp(props.tfs1);
            const tfs1_text = formatValue(props.tfs1_text);
            const tfs2 = formatTemp(props.tfs2);
            const tfs2_text = formatValue(props.tfs2_text);
            const tfs3 = formatTemp(props.tfs3);
            const tfs3_text = formatValue(props.tfs3_text);
            
            const stationLink = props.station ? `<a href="https://mesonet.agron.iastate.edu/sites/site.php?network=${props.network}&amp;station=${props.station}" target="_blank" style="color: white; text-decoration: none;">${name} [${station}]</a>` : `${name} [${station}]`;

            const html = `
                <div class="popup-content" style="padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; position: relative;">
                    <h4 style="margin: 0 0 12px 0; padding: 8px 12px; background: #2c5aa0; color: white; border-radius: 6px 6px 0 0; font-size: 14px; font-weight: 600; position: relative;">
                        ${stationLink}
                        <button onclick="this.closest('.popup-content').parentElement.style.display='none'" style="position: absolute; top: 6px; right: 8px; background: none; border: none; color: white; font-size: 16px; cursor: pointer; padding: 0; width: 20px; height: 20px; line-height: 1; font-weight: bold;">&times;</button>
                    </h4>
                    <div style="padding: 0 12px 12px 12px; font-size: 13px; line-height: 1.4;">
                        <div style="margin-bottom: 4px;"><strong>Ob:</strong> ${localTime} ${utcTime}</div>
                        <div style="margin-bottom: 4px;"><strong>Air Temps:</strong> ${tmpf}/${dwpf} Feel: ${feel} ${relh}</div>
                        <div style="margin-bottom: 4px;"><strong>Pavement:</strong> ${tfs0} ${tfs0_text}</div>
                        <div style="margin-bottom: 4px;"><strong>Pavement:</strong> ${tfs1} ${tfs1_text}</div>
                        <div style="margin-bottom: 4px;"><strong>Pavement:</strong> ${tfs2} ${tfs2_text}</div>
                        <div style="margin-bottom: 0;"><strong>Pavement:</strong> ${tfs3} ${tfs3_text}</div>
                    </div>
                </div>
            `;
                        
            if (popupEl) {
                popupEl.innerHTML = html;
                popupEl.style.display = 'block';
                popupEl.style.visibility = 'visible';
            }
            if (overlay && feature.getGeometry) {
                const coords = feature.getGeometry().getCoordinates();
                overlay.setPosition(coords);
            }
        });
    }

    // Auto-refresh behavior: subscribe to current time changes
    try {
        
        const doRefreshIfNeeded = (dtime) => {
            const current = dtime || getCurrentTime();
            const isRt = getIsRealTime();
            
            if (isRt) {
                // Realtime mode: only refresh every 5 minutes
                const minute = current.getUTCMinutes();
                if (minute % 5 === 0) {
                    refreshPointObservations(layer, defaultUrl);
                }
            } else {
                // Archive mode: always refresh with valid=ISO parameter
                const iso = current.toISOString();
                refreshPointObservations(layer, `${defaultUrl}?valid=${encodeURIComponent(iso)}`);
            }
        };
        
        // Subscribe to updates
        subscribeToCurrentTime(doRefreshIfNeeded);
        // Also do an initial call
        doRefreshIfNeeded();
    } catch {
        // If state helpers not available, skip auto refresh
    }

    return layer;
}
