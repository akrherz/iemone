import { initializeMap } from '../src/map';

describe('Map', () => {
    it('should import initializeMap function', () => {
        expect(typeof initializeMap).toBe('function');
    });
});
