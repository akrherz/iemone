import { initializeURLHandler } from '../src/urlHandler';

describe('URLHandler', () => {
    it('should import initializeURLHandler function', () => {
        expect(typeof initializeURLHandler).toBe('function');
    });
});
