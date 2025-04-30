import {
    StateKeys,
    getState,
    setState,
    getCurrentTime,
    setCurrentTime,
    getIsRealTime,
    setIsRealTime,
    getActivePhenomena,
    toggleActivePhenomenon,
    saveState,
    loadState,
    subscribeToState,
    subscribeToCurrentTime,
    subscribeToRealTime
} from '../src/state';

describe('State Management', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.resetModules();
        jest.useFakeTimers();
        require('../src/state');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initial State', () => {
        test('should initialize with default values when no saved state', () => {
            const defaultState = {
                isRealtime: true,
                lat: 39.8283,
                lon: -98.5795,
                zoom: 4.0,
                activePhenomena: new Set([
                    "TO.W", "SV.W", "FF.W", "FL.W", "MA.W",
                    "DS.W", "SQ.W", "EW.W", "FL.Y", "FA.Y", "DS.Y"
                ])
            };

            // Current time will be close to now, verify it has expected Date methods
            const currentTime = getState(StateKeys.CURRENT_TIME);
            expect(typeof currentTime.getTime).toBe('function');
            expect(typeof currentTime.toISOString).toBe('function');
            expect(getState(StateKeys.IS_REALTIME)).toBe(defaultState.isRealtime);
            expect(getState(StateKeys.LAT)).toBe(defaultState.lat);
            expect(getState(StateKeys.LON)).toBe(defaultState.lon);
            expect(getState(StateKeys.ZOOM)).toBe(defaultState.zoom);
            expect(getState(StateKeys.ACTIVE_PHENOMENA)).toEqual(defaultState.activePhenomena);
        });
    });

    describe('State Operations', () => {
        test('setState should update state and notify subscribers', () => {
            const callback = jest.fn();
            subscribeToState(StateKeys.LAT, callback);
            
            setState(StateKeys.LAT, 42.0);
            
            expect(getState(StateKeys.LAT)).toBe(42.0);
            expect(callback).toHaveBeenCalledWith(42.0);
        });

        test('setState with null key should not update state', () => {
            const originalLat = getState(StateKeys.LAT);
            setState(null, 42.0);
            expect(getState(StateKeys.LAT)).toBe(originalLat);
        });
    });

    describe('Time Management', () => {
        test('setCurrentTime should update time and disable realtime', () => {
            const newTime = new Date('2025-02-01T00:00:00.000Z');
            setCurrentTime(newTime);
            
            expect(getCurrentTime()).toEqual(newTime);
            expect(getIsRealTime()).toBe(false);
        });

        test('setIsRealTime should update realtime state', () => {
            const callback = jest.fn();
            subscribeToRealTime(callback);
            
            setIsRealTime(false);
            expect(getIsRealTime()).toBe(false);
            expect(callback).toHaveBeenCalledWith(false);
        });

        test('subscribeToCurrentTime should receive time updates', () => {
            const callback = jest.fn();
            subscribeToCurrentTime(callback);
            
            const newTime = new Date('2025-02-01T00:00:00.000Z');
            setCurrentTime(newTime);
            
            expect(callback).toHaveBeenCalledWith(newTime);
        });
    });

    describe('Phenomena Management', () => {
        test('toggleActivePhenomenon should toggle phenomenon state', () => {
            const phenomena = getActivePhenomena();
            const initialCount = phenomena.size;
            
            // Toggle existing phenomenon off
            toggleActivePhenomenon('TO.W');
            expect(getActivePhenomena().has('TO.W')).toBe(false);
            expect(getActivePhenomena().size).toBe(initialCount - 1);
            
            // Toggle new phenomenon on
            toggleActivePhenomenon('NEW.W');
            expect(getActivePhenomena().has('NEW.W')).toBe(true);
        });
    });

    describe('State Persistence', () => {
        test('saveState should persist state to localStorage', () => {
            setCurrentTime(new Date('2025-02-01T00:00:00.000Z'));
            setIsRealTime(false);
            setState(StateKeys.LAT, 42.0);
            setState(StateKeys.LON, -93.0);
            setState(StateKeys.ZOOM, 8.0);
            
            // First clear existing phenomena and add our test one
            const phenomena = getActivePhenomena();
            phenomena.clear();
            phenomena.add('NEW.W');
            setState(StateKeys.ACTIVE_PHENOMENA, phenomena);
            
            saveState();
            
            const savedState = JSON.parse(localStorage.getItem('iemone_state'));
            expect(savedState.latitude).toBe(42.0);
            expect(savedState.longitude).toBe(-93.0);
            expect(savedState.zoom).toBe(8.0);
            expect(savedState.isRealtime).toBe(false);
            expect(savedState.currentTime).toBe('2025-02-01T00:00:00.000Z');
            expect(savedState.activePhenomena).toContain('NEW.W');
            expect(savedState.activePhenomena.length).toBe(1);
        });

        test('loadState should load state from localStorage', () => {
            const testState = {
                latitude: 42.0,
                longitude: -93.0,
                zoom: 8.0,
                isRealtime: false,
                currentTime: '2025-02-01T00:00:00.000Z',
                activePhenomena: ['TO.W', 'NEW.W']
            };
            
            localStorage.setItem('iemone_state', JSON.stringify(testState));
            
            const loadedState = loadState();
            expect(loadedState.latitude).toBe(42.0);
            expect(loadedState.longitude).toBe(-93.0);
            expect(loadedState.zoom).toBe(8.0);
            expect(loadedState.isRealtime).toBe(false);
            expect(loadedState.currentTime).toEqual(new Date('2025-02-01T00:00:00.000Z'));
            expect(loadedState.activePhenomena instanceof Set).toBe(true);
            expect(loadedState.activePhenomena.has('TO.W')).toBe(true);
            expect(loadedState.activePhenomena.has('NEW.W')).toBe(true);
        });

        test('loadState should handle invalid JSON', () => {
            localStorage.setItem('iemone_state', 'invalid json');
            const loadedState = loadState();
            expect(loadedState).toBeNull();
        });
    });

    describe('Visibility Change Handling', () => {
        test('should update time when tab becomes visible in realtime mode', () => {
            setIsRealTime(true);
            const initialTime = getCurrentTime();
            
            // Simulate tab becoming visible
            Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                writable: true
            });
            document.dispatchEvent(new Event('visibilitychange'));
            
            expect(getCurrentTime()).not.toBe(initialTime);
        });

        test('should not update time when tab becomes visible in non-realtime mode', () => {
            setIsRealTime(false);
            const initialTime = getCurrentTime();
            
            Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                writable: true
            });
            document.dispatchEvent(new Event('visibilitychange'));
            
            expect(getCurrentTime()).toBe(initialTime);
        });
    });

    describe('Realtime Interval', () => {
        test('should update time every minute in realtime mode', () => {
            setIsRealTime(true);
            const callback = jest.fn();
            subscribeToCurrentTime(callback);
            
            // Fast forward 1 minute
            jest.advanceTimersByTime(60000);
            
            expect(callback).toHaveBeenCalled();
        });

        test('should stop interval when realtime mode is disabled', () => {
            setIsRealTime(true);
            const callback = jest.fn();
            subscribeToCurrentTime(callback);
            
            setIsRealTime(false);
            jest.advanceTimersByTime(60000);
            
            expect(callback).not.toHaveBeenCalled();
        });

        test('should restart interval when realtime mode is re-enabled', () => {
            setIsRealTime(false);
            const callback = jest.fn();
            subscribeToCurrentTime(callback);
            
            setIsRealTime(true);
            jest.advanceTimersByTime(60000);
            
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('loadState should handle null/undefined activePhenomena', () => {
            const testState = {
                latitude: 42.0,
                longitude: -93.0,
                zoom: 8.0,
                isRealtime: false,
                currentTime: '2025-02-01T00:00:00.000Z',
                activePhenomena: null
            };
            
            localStorage.setItem('iemone_state', JSON.stringify(testState));
            const loadedState = loadState();
            expect(loadedState.activePhenomena).toEqual(new Set([
                "TO.W", "SV.W", "FF.W", "FL.W", "MA.W",
                "DS.W", "SQ.W", "EW.W", "FL.Y", "FA.Y", "DS.Y"
            ]));
        });

        test('loadState should handle empty activePhenomena array', () => {
            const testState = {
                latitude: 42.0,
                longitude: -93.0,
                zoom: 8.0,
                isRealtime: false,
                currentTime: '2025-02-01T00:00:00.000Z',
                activePhenomena: []
            };
            
            localStorage.setItem('iemone_state', JSON.stringify(testState));
            const loadedState = loadState();
            expect(loadedState.activePhenomena).toEqual(new Set([
                "TO.W", "SV.W", "FF.W", "FL.W", "MA.W",
                "DS.W", "SQ.W", "EW.W", "FL.Y", "FA.Y", "DS.Y"
            ]));
        });

        test('loadState should handle empty object activePhenomena', () => {
            const testState = {
                latitude: 42.0,
                longitude: -93.0,
                zoom: 8.0,
                isRealtime: false,
                currentTime: '2025-02-01T00:00:00.000Z',
                activePhenomena: {}
            };
            
            localStorage.setItem('iemone_state', JSON.stringify(testState));
            const loadedState = loadState();
            expect(loadedState.activePhenomena).toEqual(new Set([
                "TO.W", "SV.W", "FF.W", "FL.W", "MA.W",
                "DS.W", "SQ.W", "EW.W", "FL.Y", "FA.Y", "DS.Y"
            ]));
        });

        test('loadState should handle missing isRealtime', () => {
            const testState = {
                latitude: 42.0,
                longitude: -93.0,
                zoom: 8.0,
                currentTime: '2025-02-01T00:00:00.000Z',
                activePhenomena: ['TO.W']
            };
            
            localStorage.setItem('iemone_state', JSON.stringify(testState));
            const loadedState = loadState();
            expect(loadedState.isRealtime).toBe(true);
        });

        test('loadState should handle missing state key', () => {
            localStorage.removeItem('iemone_state');
            const loadedState = loadState();
            expect(loadedState).toBeNull();
        });

        test('loadState should handle invalid date string', () => {
            const testState = {
                latitude: 42.0,
                longitude: -93.0,
                zoom: 8.0,
                isRealtime: false,
                currentTime: 'invalid-date',
                activePhenomena: ['TO.W']
            };
            
            localStorage.setItem('iemone_state', JSON.stringify(testState));
            const loadedState = loadState();
            // When given an invalid date string, loadState should use current time
            expect(loadedState.currentTime).toBeDefined();
            expect(typeof loadedState.currentTime.getTime).toBe('function');
            expect(typeof loadedState.currentTime.toISOString).toBe('function');
            // And isRealtime should be true since we couldn't parse the saved time
            expect(loadedState.isRealtime).toBe(true);
            // The time should be close to now
            const timeDiff = Math.abs(loadedState.currentTime.getTime() - Date.now());
            expect(timeDiff).toBeLessThan(1000); // Within 1 second
        });
    });
});