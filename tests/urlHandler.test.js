jest.mock('../src/state', () => ({
    getState: jest.fn(),
    getCurrentTime: jest.fn(),
    setCurrentTime: jest.fn(),
    subscribeToState: jest.fn(),
    setState: jest.fn(),
    setLayerVisibility: jest.fn(),
    StateKeys: {
        CURRENT_TIME: 'currentTime',
        IS_REALTIME: 'isRealtime',
        LON: 'lon',
        LAT: 'lat',
        ZOOM: 'zoom',
        RWIS_LABEL: 'rwisLabel',
        LAYER_VISIBILITY: 'layerVisibility'
    }
}));

jest.mock('../src/utils', () => ({
    formatTimestampToUTC: jest.fn()
}));

import { initializeURLHandler } from '../src/urlHandler';
import {
    getState,
    getCurrentTime,
    setCurrentTime,
    subscribeToState,
    setState,
    setLayerVisibility,
    StateKeys
} from '../src/state';
import { formatTimestampToUTC } from '../src/utils';

describe('URLHandler', () => {
    let callbacks;
    let replaceStateSpy;

    beforeEach(() => {
        callbacks = new Map();
        subscribeToState.mockImplementation((key, cb) => callbacks.set(key, cb));
        getState.mockReturnValue(false);
        getCurrentTime.mockReturnValue(new Date('2025-01-01T12:34:00Z'));
        formatTimestampToUTC.mockReturnValue('202501011234');

        replaceStateSpy = jest.spyOn(window.history, 'replaceState');
        window.history.replaceState(null, '', '/');
        replaceStateSpy.mockClear();
    });

    afterEach(() => {
        replaceStateSpy.mockRestore();
        jest.clearAllMocks();
    });

    it('should import initializeURLHandler function', () => {
        expect(typeof initializeURLHandler).toBe('function');
    });

    it('parses timestamp from URL and sets current time', () => {
        window.history.replaceState(null, '', '/?timestamp=202501011230');
        replaceStateSpy.mockClear();

        initializeURLHandler();

        expect(setCurrentTime).toHaveBeenCalledTimes(1);
        const time = setCurrentTime.mock.calls[0][0];
        expect(time).toEqual(new Date(Date.UTC(2025, 0, 1, 12, 30)));
    });

    it('parses map position params and sets state', () => {
        window.history.replaceState(null, '', '/?lon=-93.5&lat=41.99&zoom=7');
        replaceStateSpy.mockClear();

        initializeURLHandler();

        expect(setState).toHaveBeenCalledWith(StateKeys.LON, -93.5);
        expect(setState).toHaveBeenCalledWith(StateKeys.LAT, 41.99);
        expect(setState).toHaveBeenCalledWith(StateKeys.ZOOM, 7);
    });

    it('parses layer visibility and rwis label params', () => {
        window.history.replaceState(null, '', '/?radar=0&warnings=1&dashcam=true&rwisobs_label=Station');
        replaceStateSpy.mockClear();

        initializeURLHandler();

        expect(setLayerVisibility).toHaveBeenCalledWith('radar', false);
        expect(setLayerVisibility).toHaveBeenCalledWith('warnings', true);
        expect(setLayerVisibility).toHaveBeenCalledWith('dashcam', true);
        expect(setState).toHaveBeenCalledWith(StateKeys.RWIS_LABEL, 'Station');
    });

    it('updates timestamp param when time changes', () => {
        initializeURLHandler();
        callbacks.get(StateKeys.CURRENT_TIME)(new Date('2025-01-01T12:34:00Z'));

        expect(formatTimestampToUTC).toHaveBeenCalled();
        expect(replaceStateSpy).toHaveBeenCalled();
        const url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toBe('?timestamp=202501011234');
    });

    it('removes timestamp when realtime is enabled', () => {
        initializeURLHandler();
        callbacks.get(StateKeys.IS_REALTIME)(true);

        const url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toBe('?');
    });

    it('adds timestamp when realtime is disabled', () => {
        initializeURLHandler();
        callbacks.get(StateKeys.IS_REALTIME)(false);

        const url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toBe('?timestamp=202501011234');
    });

    it('formats and writes lon/lat/zoom updates', () => {
        initializeURLHandler();
        callbacks.get(StateKeys.LON)(-93.12345);
        callbacks.get(StateKeys.LAT)(41.98765);
        callbacks.get(StateKeys.ZOOM)(8);

        const url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toContain('lon=-93.1235');
        expect(url).toContain('lat=41.9877');
        expect(url).toContain('zoom=8');
    });

    it('writes and clears rwis label updates', () => {
        initializeURLHandler();
        callbacks.get(StateKeys.RWIS_LABEL)('Road Temp');
        let url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toContain('rwisobs_label=Road+Temp');

        callbacks.get(StateKeys.RWIS_LABEL)(null);
        url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toBe('?');
    });

    it('writes non-default layer visibility values', () => {
        initializeURLHandler();
        callbacks.get(StateKeys.LAYER_VISIBILITY)({ radar: false });

        let url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toContain('radar=0');

        callbacks.get(StateKeys.LAYER_VISIBILITY)({ radar: true });
        url = replaceStateSpy.mock.calls.at(-1)[2];
        expect(url).toBe('?');
    });
});
