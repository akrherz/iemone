describe('URL then localStorage merge', () => {
    beforeEach(() => {
        // Reset module state so state.loadState() runs after we set localStorage
        jest.resetModules();
        // Put conflicting value in localStorage (rwisobs false)
        const lstate = { layerVisibility: { rwisobs: false } };
        localStorage.setItem('iemone_state', JSON.stringify(lstate));
        // Mock URL with rwisobs=1 via history.replaceState so window.location.search is set
        window.history.replaceState(null, '', '/?rwisobs=1');
    });

    afterEach(() => {
        localStorage.removeItem('iemone_state');
        jest.resetModules();
    });

    it('URL override should win over localStorage for rwisobs', () => {
        // Require modules after we've set localStorage and location so initial load picks them up
        const { initializeURLHandler } = require('../src/urlHandler');
        const { applyLocalStorageFallbackToState } = require('../src/initialState');
        const { getLayerVisibility } = require('../src/state');

        // Initialize URL handler (applies URL params first)
        initializeURLHandler();
        // Then apply localStorage fallback (should not override rwisobs)
        applyLocalStorageFallbackToState();

        const visibility = getLayerVisibility('rwisobs');
        expect(visibility).toBe(true);
    });
});
