import { webcamRegistry } from '../src/webcamRegistry';

describe('WebcamRegistry', () => {
    it('should import webcamRegistry instance', () => {
        expect(webcamRegistry).toBeDefined();
        expect(typeof webcamRegistry).toBe('object');
    });
});
