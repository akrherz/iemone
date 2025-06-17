import { refreshJSON, getWebcamLayers, initializeWebcam } from '../src/webcamManager';

describe('WebcamManager', () => {
    it('should import refreshJSON function', () => {
        expect(typeof refreshJSON).toBe('function');
    });

    it('should import getWebcamLayers function', () => {
        expect(typeof getWebcamLayers).toBe('function');
    });

    it('should import initializeWebcam function', () => {
        expect(typeof initializeWebcam).toBe('function');
    });
});
