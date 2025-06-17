import { WebcamWindow } from '../src/webcamWindow';

describe('WebcamWindow', () => {
    it('should import WebcamWindow class', () => {
        expect(typeof WebcamWindow).toBe('function');
        expect(WebcamWindow.name).toBe('WebcamWindow');
    });
});
