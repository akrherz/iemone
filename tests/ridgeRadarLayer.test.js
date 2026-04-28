import {
    createRidgeRadarLayers,
    getRidgeTileLayer,
    getRidgeStationsLayer,
    isRidgeActive,
    getCurrentRidgeScanTime,
    getRidgeScansForAnimation,
    onRadarStationClick,
    onProductsLoaded,
    onScansUpdated,
    onRadarsLoaded,
} from '../src/ridgeRadarLayer';

describe('ridgeRadarLayer', () => {
    it('should export createRidgeRadarLayers', () => {
        expect(typeof createRidgeRadarLayers).toBe('function');
    });

    it('should export getRidgeTileLayer', () => {
        expect(typeof getRidgeTileLayer).toBe('function');
    });

    it('should export getRidgeStationsLayer', () => {
        expect(typeof getRidgeStationsLayer).toBe('function');
    });

    it('should export isRidgeActive', () => {
        expect(typeof isRidgeActive).toBe('function');
    });

    it('should export getCurrentRidgeScanTime', () => {
        expect(typeof getCurrentRidgeScanTime).toBe('function');
    });

    it('should export getRidgeScansForAnimation', () => {
        expect(typeof getRidgeScansForAnimation).toBe('function');
    });

    it('should return empty array for scans when none loaded', () => {
        expect(getRidgeScansForAnimation()).toEqual([]);
    });

    it('should return null for current scan time when no scan selected', () => {
        expect(getCurrentRidgeScanTime()).toBeNull();
    });

    it('isRidgeActive returns false before layer creation', () => {
        expect(isRidgeActive()).toBe(false);
    });

    it('should register onRadarStationClick callbacks', () => {
        expect(typeof onRadarStationClick).toBe('function');
        expect(() => onRadarStationClick(() => {})).not.toThrow();
    });

    it('should register onProductsLoaded callbacks', () => {
        expect(typeof onProductsLoaded).toBe('function');
        expect(() => onProductsLoaded(() => {})).not.toThrow();
    });

    it('should register onScansUpdated callbacks', () => {
        expect(typeof onScansUpdated).toBe('function');
        expect(() => onScansUpdated(() => {})).not.toThrow();
    });

    it('should register onRadarsLoaded callbacks', () => {
        expect(typeof onRadarsLoaded).toBe('function');
        expect(() => onRadarsLoaded(() => {})).not.toThrow();
    });
});
