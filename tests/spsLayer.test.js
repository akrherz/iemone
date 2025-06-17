import { createSPSPopup, createSPSLayer, getSPSLayer, updateSPSLayer } from '../src/spsLayer';

describe('SPSLayer', () => {
    it('should import createSPSPopup function', () => {
        expect(typeof createSPSPopup).toBe('function');
    });

    it('should import createSPSLayer function', () => {
        expect(typeof createSPSLayer).toBe('function');
    });

    it('should import getSPSLayer function', () => {
        expect(typeof getSPSLayer).toBe('function');
    });

    it('should import updateSPSLayer function', () => {
        expect(typeof updateSPSLayer).toBe('function');
    });
});
