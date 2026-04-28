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
    buildTileUrl,
    findClosestScan,
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

    describe('buildTileUrl', () => {
        it('builds the correct tile URL for a given radar, product, and timestamp', () => {
            const url = buildTileUrl('DMX', 'N0B', '2026-04-28T12:00Z');
            expect(url).toBe(
                'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::DMX-N0B-202604281200/{z}/{x}/{y}.png'
            );
        });

        it('zero-pads month, day, hours, and minutes', () => {
            const url = buildTileUrl('ABC', 'N0Q', '2025-01-02T03:04Z');
            expect(url).toContain('ridge::ABC-N0Q-202501020304/');
        });
    });

    describe('findClosestScan', () => {
        it('returns null for an empty scan list', () => {
            expect(findClosestScan([], new Date('2026-04-28T12:00Z'))).toBeNull();
        });

        it('returns null for a null scan list', () => {
            expect(findClosestScan(null, new Date('2026-04-28T12:00Z'))).toBeNull();
        });

        it('returns the single scan when only one exists', () => {
            const scans = [{ ts: '2026-04-28T12:00Z' }];
            expect(findClosestScan(scans, new Date('2026-04-28T11:00Z'))).toEqual(scans[0]);
        });

        it('returns the scan closest to the target time', () => {
            const scans = [
                { ts: '2026-04-28T12:00Z' },
                { ts: '2026-04-28T12:05Z' },
                { ts: '2026-04-28T12:10Z' },
            ];
            const target = new Date('2026-04-28T12:06Z');
            expect(findClosestScan(scans, target)).toEqual({ ts: '2026-04-28T12:05Z' });
        });

        it('returns the earliest scan when target is before all scans', () => {
            const scans = [
                { ts: '2026-04-28T12:00Z' },
                { ts: '2026-04-28T12:05Z' },
            ];
            expect(findClosestScan(scans, new Date('2026-04-28T11:00Z'))).toEqual(scans[0]);
        });

        it('returns the latest scan when target is after all scans', () => {
            const scans = [
                { ts: '2026-04-28T12:00Z' },
                { ts: '2026-04-28T12:05Z' },
            ];
            expect(findClosestScan(scans, new Date('2026-04-28T13:00Z'))).toEqual(scans[1]);
        });
    });
});
