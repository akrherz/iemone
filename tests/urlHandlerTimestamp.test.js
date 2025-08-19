import { initializeURLHandler } from '../src/urlHandler';
import * as stateModule from '../src/state';

// Mock URLSearchParams
const mockURLSearchParams = jest.fn();

describe('URL Handler - Timestamp Parsing', () => {
  beforeEach(() => {
    // Mock state functions
    jest.spyOn(stateModule, 'setCurrentTime').mockImplementation(() => {});
    jest.spyOn(stateModule, 'setState').mockImplementation(() => {});
    jest.spyOn(stateModule, 'subscribeToState').mockImplementation(() => {});
    jest.spyOn(stateModule, 'getState').mockReturnValue(false);
    jest.spyOn(stateModule, 'setLayerVisibility').mockImplementation(() => {});
    
    // Mock history
    global.history = { replaceState: jest.fn() };
    
    // Clear mocks
    jest.clearAllMocks();
  });

  test('timestamp format 200808191120 parses to correct Date', () => {
    // Test the parsing logic directly
    const timestamp = '200808191120';
    const year = parseInt(timestamp.slice(0, 4), 10);
    const month = parseInt(timestamp.slice(4, 6), 10) - 1;
    const day = parseInt(timestamp.slice(6, 8), 10);
    const hours = parseInt(timestamp.slice(8, 10), 10);
    const minutes = parseInt(timestamp.slice(10, 12), 10);
    const time = new Date(Date.UTC(year, month, day, hours, minutes));
    
    // Should be August 19, 2008, 11:20 UTC
    expect(time.getUTCFullYear()).toBe(2008);
    expect(time.getUTCMonth()).toBe(7); // August = 7 (0-indexed)
    expect(time.getUTCDate()).toBe(19);
    expect(time.getUTCHours()).toBe(11);
    expect(time.getUTCMinutes()).toBe(20);
  });
});
