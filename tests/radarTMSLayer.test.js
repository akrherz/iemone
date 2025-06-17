import { createRadarTMSLayer, updateRadarTMSLayer, resetRadarTMSLayer } from '../src/radarTMSLayer';

describe('RadarTMSLayer', () => {
    it('should import createRadarTMSLayer function', () => {
        expect(typeof createRadarTMSLayer).toBe('function');
    });

    it('should import updateRadarTMSLayer function', () => {
        expect(typeof updateRadarTMSLayer).toBe('function');
    });

    it('should import resetRadarTMSLayer function', () => {
        expect(typeof resetRadarTMSLayer).toBe('function');
    });
});
