import { getIsRealTime, getCurrentTime } from './state.js';
import { webcamRegistry } from './webcamRegistry.js';
import strftime from 'strftime';

// Track window count for positioning offsets
let windowCount = 0;
let topZIndex = 2100;

// Store preferred window dimensions  
const preferredWindowSize = {
    width: 0,
    height: 0
};

export class WebcamWindow {
    constructor(options = {}) {
        this.options = {
            src: options.src || '',
            title: options.title || 'Webcam View',
            refreshInterval: options.refreshInterval || 30000,
            views: options.views || null, // Object with view names and URLs
            cid: options.cid || null, // Camera identifier for registry
            timestamp: options.timestamp || null, // Timestamp for the image
            layer: options.layer || null, // Reference to OpenLayers layer
            ...options
        };
        
        // Store base title for timestamp display
        this.baseTitle = this.options.title;
        
        // Assign unique ID and increment count
        this.windowId = ++windowCount;
        
        this.window = null;
        this.image = null;
        this.refreshTimer = null;
        this.layerListener = null;
        this.isVisible = false;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startX = 0;
        this.startY = 0;
        this.currentView = null; // Track current view for multi-view cameras
        this.lastKnownImageUrl = null; // Track last known image URL for change detection
        
        // Set initial view for multi-view cameras
        if (this.options.views) {
            const viewNames = Object.keys(this.options.views);
            this.currentView = viewNames[0];
        }
        
        this.createWindow();
        this.setupEventListeners();
        this.show();
        
        // Initialize lastKnownImageUrl with current src or current view
        if (this.options.views && this.currentView && this.options.views[this.currentView]) {
            this.lastKnownImageUrl = this.options.views[this.currentView];
        } else {
            this.lastKnownImageUrl = this.options.src;
        }
        
        // Set up layer listener for data updates
        this.setupLayerListener();
        
        // Update initial title with timestamp
        this.updateTitleWithTimestamp();
        
        // Register with webcam registry if we have a camera ID
        if (this.options.cid) {
            webcamRegistry.registerWindow(this.options.cid, this);
        }
    }

    createWindow() {
        this.window = document.createElement('div');
        this.window.className = 'webcam-window';
        
        // Create view selector if multiple views available
        const viewSelectorHtml = this.options.views ? this.createViewSelectorHtml() : '';
        
        this.window.innerHTML = `
            <div class="webcam-window-header">
                <span class="webcam-window-title">${this.escapeHtml(this.baseTitle)}</span>
                <button class="webcam-window-close" title="Close">✖</button>
            </div>
            <div class="webcam-window-content">
                ${viewSelectorHtml}
                <div class="webcam-image-container">
                    <img class="webcam-image" src="${this.options.src}" alt="Webcam view" />
                    <div class="webcam-loading">Loading...</div>
                    <div class="webcam-error" style="display: none;">Failed to load image</div>
                </div>
            </div>
            <div class="webcam-resize-handle webcam-resize-se" title="Resize"></div>
            <div class="webcam-resize-handle webcam-resize-s" title="Resize"></div>
            <div class="webcam-resize-handle webcam-resize-e" title="Resize"></div>
        `;

        // Apply offset positioning for multiple windows
        const offset = (this.windowId - 1) * 30;
        this.window.style.top = `calc(50% + ${offset}px)`;
        this.window.style.left = `calc(50% + ${offset}px)`;
        this.window.style.zIndex = (++topZIndex).toString();

        document.body.appendChild(this.window);
        
        this.image = /** @type {HTMLImageElement} */ (this.window.querySelector('.webcam-image'));
        this.loadingIndicator = /** @type {HTMLElement} */ (this.window.querySelector('.webcam-loading'));
        this.errorIndicator = /** @type {HTMLElement} */ (this.window.querySelector('.webcam-error'));
        
        // Apply preferred size if available
        if (preferredWindowSize.width > 0 && preferredWindowSize.height > 0) {
            this.window.style.width = `${preferredWindowSize.width}px`;
            this.window.style.height = `${preferredWindowSize.height}px`;
        }
    }

    setupEventListeners() {
        const closeButton = this.window?.querySelector('.webcam-window-close');
        const header = this.window?.querySelector('.webcam-window-header');
        const resizeHandles = this.window?.querySelectorAll('.webcam-resize-handle');
        const viewSelector = this.window?.querySelector('.webcam-view-select');

        closeButton?.addEventListener('click', () => this.destroy());

        // Add view selector event listener for RWIS cameras
        if (viewSelector) {
            viewSelector.addEventListener('change', (e) => {
                const selectedView = /** @type {HTMLSelectElement} */ (e.target).value;
                this.switchView(selectedView);
            });
        }

        this.boundHandleDragAndResize = this.handleDragAndResize.bind(this);
        this.boundStopDragAndResize = this.stopDragAndResize.bind(this);

        if (window.innerWidth > 768 && header) {
            header.addEventListener('mousedown', (e) => {
                // Only start drag if not clicking on close button or resize handle
                const target = /** @type {HTMLElement} */ (e.target);
                if (!target?.classList?.contains('webcam-resize-handle') && 
                    !target?.classList?.contains('webcam-modal-close')) {
                    this.startDrag(e);
                }
            });
        }

        if (window.innerWidth > 768 && resizeHandles) {
            resizeHandles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => this.startResize(e));
            });
        }

        window.addEventListener('resize', () => this.handleResize());

        // Bring window to front on click
        this.window?.addEventListener('mousedown', () => this.bringToFront());

        this.image?.addEventListener('load', () => this.handleImageLoad());
        this.image?.addEventListener('error', () => this.handleImageError());
    }

    startDrag(e) {
        this.isDragging = true;
        if (this.window) {
            const rect = this.window.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            this.window.style.transition = 'none';
        }
        
        // Add global event listeners for drag
        document.addEventListener('mousemove', this.boundHandleDragAndResize);
        document.addEventListener('mouseup', this.boundStopDragAndResize);
    }

    startResize(e) {
        e.stopPropagation();
        e.preventDefault();
        this.isResizing = true;
        
        if (this.window) {
            const rect = this.window.getBoundingClientRect();
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startWidth = rect.width;
            this.startHeight = rect.height;
            
            // Determine resize direction from class name
            const classList = e.target.classList;
            if (classList.contains('webcam-resize-se')) {
                this.resizeDirection = 'se';
            } else if (classList.contains('webcam-resize-s')) {
                this.resizeDirection = 's';
            } else if (classList.contains('webcam-resize-e')) {
                this.resizeDirection = 'e';
            }
            
            this.window.style.transition = 'none';
        }
        
        // Add global event listeners for resize
        document.addEventListener('mousemove', this.boundHandleDragAndResize);
        document.addEventListener('mouseup', this.boundStopDragAndResize);
    }

    handleDragAndResize(e) {
        if (this.isDragging && this.window) {
            this.window.style.left = `${e.clientX - this.offsetX}px`;
            this.window.style.top = `${e.clientY - this.offsetY}px`;
            this.window.style.transform = 'none';
        }
        
        if (this.isResizing && this.window) {
            const deltaX = e.clientX - this.startX;
            const deltaY = e.clientY - this.startY;
            
            let newWidth = this.startWidth;
            let newHeight = this.startHeight;
            
            if (this.resizeDirection === 'se') {
                newWidth = Math.max(240, this.startWidth + deltaX);
                newHeight = Math.max(180, this.startHeight + deltaY);
            } else if (this.resizeDirection === 's') {
                newHeight = Math.max(180, this.startHeight + deltaY);
            } else if (this.resizeDirection === 'e') {
                newWidth = Math.max(240, this.startWidth + deltaX);
            }
            
            this.window.style.width = `${newWidth}px`;
            this.window.style.height = `${newHeight}px`;
            this.window.style.transform = 'none';
        }
    }

    stopDragAndResize() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = null;
        
        if (this.window) {
            this.window.style.transition = '';
            
            // Save the current size as preferred size for future windows
            if (this.window.style.width && this.window.style.height) {
                const rect = this.window.getBoundingClientRect();
                preferredWindowSize.width = rect.width;
                preferredWindowSize.height = rect.height;
            }
        }
        
        document.removeEventListener('mousemove', this.boundHandleDragAndResize);
        document.removeEventListener('mouseup', this.boundStopDragAndResize);
    }

    bringToFront() {
        if (this.window) {
            this.window.style.zIndex = (++topZIndex).toString();
        }
    }



    handleResize() {
        if (window.innerWidth <= 768 && this.window) {
            if (this.window.style.transform === 'none' || this.window.style.width || this.window.style.height) {
                this.window.style.transform = '';
                this.window.style.left = '';
                this.window.style.top = '';
                this.window.style.width = '';
                this.window.style.height = '';
            }
        }
    }

    handleImageLoad() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
        if (this.errorIndicator) {
            this.errorIndicator.style.display = 'none';
        }
        if (this.image) {
            this.image.classList.remove('loading');
        }
    }

    handleImageError() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
        if (this.errorIndicator) {
            this.errorIndicator.style.display = 'block';
        }
        if (this.image) {
            this.image.classList.remove('loading');
        }
    }

    show() {
        setTimeout(() => {
            if (this.window) {
                this.window.classList.add('open');
                this.isVisible = true;
            }
        }, 10);

        if (getIsRealTime()) {
            // Layer listener handles updates, no timer needed
        }
    }

    hide() {
        if (this.window) {
            this.window.classList.remove('open');
        }
        this.isVisible = false;
        this.removeLayerListener();
    }

    destroy() {
        this.hide();
        this.removeLayerListener();
        
        // Unregister from webcam registry
        if (this.options.cid) {
            webcamRegistry.unregisterWindow(this.options.cid);
        }
        
        this.stopDragAndResize();
        
        setTimeout(() => {
            if (this.window && this.window.parentNode) {
                this.window.parentNode.removeChild(this.window);
            }
        }, 300);
    }

    setupLayerListener() {
        if (!this.options.layer || !this.options.cid) {
            return;
        }

        const source = this.options.layer.getSource();
        if (!source) {
            return;
        }

        this.layerListener = () => {
            console.error("WebcamWindow: Layer data updated, handling changes for CID:", this.options.cid);
            this.handleLayerDataUpdate();
        };

        source.on('featuresloadend', this.layerListener);
    }

    removeLayerListener() {
        if (this.layerListener && this.options.layer) {
            const source = this.options.layer.getSource();
            if (source) {
                source.un('featuresloadend', this.layerListener);
            }
            this.layerListener = null;
        }
    }

    handleLayerDataUpdate() {
        if (!this.options.cid || !this.options.layer) {
            return;
        }

        const feature = this.findFeatureInLayer();
        if (!feature) {
            return;
        }

        let currentImageUrl = null;
        
        if (this.options.views && this.currentView) {
            const viewUrls = {};
            for (let i = 1; i <= 9; i++) {
                const imgurl = feature.get(`imgurl${i}`);
                if (imgurl) {
                    viewUrls[`View ${i}`] = imgurl;
                }
            }
            
            if (viewUrls[this.currentView]) {
                currentImageUrl = viewUrls[this.currentView];
            }
            
            if (JSON.stringify(viewUrls) !== JSON.stringify(this.options.views)) {
                this.updateViews(viewUrls);
            }
        } else {
            currentImageUrl = feature.get('imgurl') || feature.get('url');
        }

        const newTimestamp = feature.get('utc_valid') || feature.get('valid');
        if (newTimestamp && newTimestamp !== this.options.timestamp) {
            this.updateTimestamp(newTimestamp);
        }

        if (currentImageUrl && currentImageUrl !== this.lastKnownImageUrl) {
            this.lastKnownImageUrl = currentImageUrl;
            this.options.src = currentImageUrl;
            this.refresh();
        }
    }

    findFeatureInLayer() {
        if (!this.options.layer || !this.options.cid) {
            return null;
        }

        const source = this.options.layer.getSource();
        if (!source) {
            return null;
        }

        const features = source.getFeatures();
        return features.find(feature => feature.get('cid') === this.options.cid) || null;
    }

    refresh() {
        if (!this.options.src) {
            return;
        }
        
        if (this.image) {
            this.image.classList.add('loading');
        }
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }
        if (this.errorIndicator) {
            this.errorIndicator.style.display = 'none';
        }
        
        let currentSrc = this.options.src;
        if (this.options.views && this.currentView && this.options.views[this.currentView]) {
            currentSrc = this.options.views[this.currentView];
        }
        
        const timestamp = new Date().getTime();
        const separator = currentSrc.includes('?') ? '&' : '?';
        if (this.image) {
            this.image.src = `${currentSrc}${separator}_t=${timestamp}`;
        }
    }

    updateTitle(title) {
        this.baseTitle = title;
        this.options.title = title;
        this.updateTitleWithTimestamp();
    }

    updateTitleWithTimestamp() {
        const titleElement = this.window?.querySelector('.webcam-window-title');
        if (titleElement) {
            let displayTime;
            if (this.options.timestamp) {
                displayTime = new Date(this.options.timestamp);
            } else {
                displayTime = new Date(getCurrentTime());
            }
            const timestamp = strftime('@%-I:%M %p', displayTime);
            const fullTitle = `${this.baseTitle} ${timestamp}`;
            titleElement.textContent = fullTitle;
        }
    }

    updateImage(src) {
        this.options.src = src;
        if (this.image) {
            this.refresh();
        }
    }

    updateTimestamp(timestamp) {
        this.options.timestamp = timestamp;
        this.updateTitleWithTimestamp();
    }

    updateViews(newViews) {
        if (!newViews || typeof newViews !== 'object') {
            return;
        }
        
        this.options.views = newViews;
        
        // Update the view selector dropdown
        const viewSelector = /** @type {HTMLSelectElement} */ (this.window?.querySelector('.webcam-view-select'));
        if (viewSelector) {
            const currentSelection = viewSelector.value;
            const viewNames = Object.keys(newViews);
            
            // Clear and rebuild options
            viewSelector.innerHTML = '';
            viewNames.forEach(viewName => {
                const option = document.createElement('option');
                option.value = viewName;
                option.textContent = viewName;
                option.selected = viewName === currentSelection || viewName === this.currentView;
                viewSelector.appendChild(option);
            });
            
            // Update current view if it's no longer available
            if (this.currentView && !newViews[this.currentView]) {
                this.currentView = viewNames[0];
                if (this.image && this.currentView) {
                    this.image.src = newViews[this.currentView];
                }
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createViewSelectorHtml() {
        if (!this.options.views) {
            return '';
        }
        
        const viewNames = Object.keys(this.options.views);
        const options = viewNames.map(viewName => 
            `<option value="${viewName}" ${viewName === this.currentView ? 'selected' : ''}>${viewName}</option>`
        ).join('');
        
        return `
            <div class="webcam-view-selector">
                <label for="view-select-${this.windowId}">Camera View:</label>
                <select id="view-select-${this.windowId}" class="webcam-view-select">
                    ${options}
                </select>
            </div>
        `;
    }

    switchView(viewName) {
        if (!this.options.views || !this.options.views[viewName]) {
            return;
        }
        
        this.currentView = viewName;
        const newSrc = this.options.views[viewName];
        
        if (this.image) {
            this.image.classList.add('loading');
            this.image.src = newSrc;
            
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'block';
            }
            if (this.errorIndicator) {
                this.errorIndicator.style.display = 'none';
            }
        }
    }
}
