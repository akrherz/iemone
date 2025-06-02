// WebcamRegistry - Manages communication between webcam data sources and active windows
import { subscribeToCurrentTime, subscribeToRealTime } from './state.js';
import { refreshJSON } from './webcamManager.js';

/**
 * @typedef {Object} WebcamData
 * @property {string} cid - Camera identifier
 * @property {string} [url] - Standard webcam URL
 * @property {string} [imgurl] - Dashcam URL  
 * @property {Object<string, string>} [views] - RWIS views (imgurl1, imgurl2, etc.)
 * @property {string} [utc_valid] - Last update timestamp
 * @property {string} [name] - Camera name/title
 */

class WebcamRegistry {
    constructor() {
        this.activeWindows = new Map(); // cid -> WebcamWindow instance
        this.currentData = new Map();   // cid -> latest WebcamData
        this.layers = [];               // OpenLayers vector layers to monitor
        this.isInitialized = false;     // Track if we're ready to handle refreshes
    }
    
    /**
     * Register a webcam window
     * @param {string} cid - Camera identifier
     * @param {Object} window - WebcamWindow instance
     */
    registerWindow(cid, window) {
        this.activeWindows.set(cid, window);
        
        // If we have current data for this camera, update the window
        const currentData = this.currentData.get(cid);
        if (currentData) {
            this.updateWindow(cid, currentData);
        }
    }
    
    /**
     * Unregister a webcam window
     * @param {string} cid - Camera identifier
     */
    unregisterWindow(cid) {
        this.activeWindows.delete(cid);
    }
    
    /**
     * Register a vector layer to monitor for feature updates
     * @param {Object} layer - OpenLayers VectorLayer
     */
    registerLayer(layer) {
        if (!layer) {
            console.warn('WebcamRegistry: Cannot register null layer');
            return;
        }
        
        this.layers.push(layer);
        
        // Initialize subscriptions on first layer registration
        if (!this.isInitialized) {
            this.isInitialized = true;
            subscribeToCurrentTime(() => this.handleDataRefresh());
            subscribeToRealTime(() => this.handleDataRefresh());
        }
        
        // Listen for source changes
        const source = layer.getSource();
        if (source) {
            source.on('featuresloadend', () => {
                this.extractDataFromLayer(layer);
            });
        } else {
            console.warn('WebcamRegistry: Layer has no source, cannot register event listener');
        }
    }
    
    /**
     * Extract webcam data from a layer's features
     * @param {Object} layer - OpenLayers VectorLayer
     */
    extractDataFromLayer(layer) {
        if (!layer) {
            return;
        }
        
        const source = layer.getSource();
        if (!source) {
            return;
        }
        
        const features = source.getFeatures();
        
        features.forEach(feature => {
            const cid = feature.get('cid');
            if (!cid) {
                return;
            }
            
            const webcamData = this.featureToWebcamData(feature);
            this.updateData(cid, webcamData);
        });
    }
    
    /**
     * Convert OpenLayers feature to WebcamData
     * @param {Object} feature - OpenLayers feature
     * @returns {WebcamData}
     */
    featureToWebcamData(feature) {
        const data = {
            cid: feature.get('cid'),
            url: feature.get('url'),
            imgurl: feature.get('imgurl'),
            utc_valid: feature.get('utc_valid'),
            name: feature.get('name')
        };
        
        // Check for RWIS views (imgurl1-9)
        const views = {};
        for (let i = 1; i <= 9; i++) {
            const imgurl = feature.get(`imgurl${i}`);
            if (imgurl) {
                views[`View ${i}`] = imgurl;
            }
        }
        
        if (Object.keys(views).length > 0) {
            data.views = views;
        }
        
        return data;
    }
    
    /**
     * Update stored data for a camera
     * @param {string} cid - Camera identifier
     * @param {WebcamData} data - Updated webcam data
     */
    updateData(cid, data) {
        const previousData = this.currentData.get(cid);
        this.currentData.set(cid, data);
        
        // If there's an active window for this camera, update it
        if (this.activeWindows.has(cid)) {
            this.updateWindow(cid, data, previousData);
        }
    }
    
    /**
     * Update a webcam window with new data
     * @param {string} cid - Camera identifier  
     * @param {WebcamData} newData - New webcam data
     * @param {WebcamData} [previousData] - Previous data for comparison
     */
    updateWindow(cid, newData, previousData) {
        const window = this.activeWindows.get(cid);
        if (!window || !newData) {
            return;
        }
        
        // Check if the image URL changed
        const oldUrl = previousData ? this.getImageUrl(previousData) : null;
        const newUrl = this.getImageUrl(newData);
        
        if (oldUrl !== newUrl) {
            // Update the window's source data
            if (newData.views) {
                // RWIS camera - update views
                window.updateViews(newData.views);
            } else {
                // Standard camera - update image
                window.updateImage(newUrl);
            }
        }
        
        // Update title if name changed
        if (newData.name && newData.name !== previousData?.name) {
            window.updateTitle(newData.name);
        }
        
        // Update timestamp if it changed
        if (newData.utc_valid && newData.utc_valid !== previousData?.utc_valid) {
            window.updateTimestamp(newData.utc_valid);
        }
    }
    
    /**
     * Get the primary image URL from webcam data
     * @param {WebcamData} data - Webcam data
     * @returns {string|null} Image URL
     */
    getImageUrl(data) {
        if (!data) {
            return null;
        }
        
        if (data.views) {
            // RWIS - return first view
            const viewUrls = Object.values(data.views);
            return viewUrls.length > 0 ? viewUrls[0] : null;
        }
        
        return data.imgurl || data.url || null;
    }
    
    /**
     * Handle data refresh (called when time changes)
     */
    handleDataRefresh() {
        // Only refresh if we're properly initialized
        if (!this.isInitialized) {
            return;
        }
        
        // Trigger refresh of GeoJSON sources
        refreshJSON();
    }
    
    /**
     * Get current data for a camera
     * @param {string} cid - Camera identifier
     * @returns {WebcamData|null}
     */
    getData(cid) {
        return this.currentData.get(cid) || null;
    }
}

// Global registry instance
export const webcamRegistry = new WebcamRegistry();
