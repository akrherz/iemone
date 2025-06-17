// Test for main.js - this module initializes the application
describe('Main', () => {
    it('should import main module without errors', () => {
        expect(() => {
            require('../src/main');
        }).not.toThrow();
    });
});
