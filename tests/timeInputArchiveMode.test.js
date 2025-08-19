import { setupTimeInputControl } from '../src/timeInputControl';
import * as radarModule from '../src/radarTMSLayer';
import * as stateModule from '../src/state';
import * as brandingModule from '../src/brandingOverlay';

// Mock the modules
jest.mock('../src/radarTMSLayer', () => ({
  updateRadarTMSLayer: jest.fn(),
  resetRadarTMSLayer: jest.fn()
}));

jest.mock('../src/brandingOverlay', () => ({
  updateBrandingOverlay: jest.fn(),
  updateAnimationBranding: jest.fn()
}));

describe('Time Input Control - Archive Mode', () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <input type="radio" id="archive-mode" name="mode" value="archive">
      <input type="radio" id="realtime-mode" name="mode" value="realtime">
      <input type="datetime-local" id="current-time" />
      <button id="time-step-backward"></button>
      <button id="time-step-forward"></button>
      <button id="time-play-pause"></button>
      <div id="branding-overlay"></div>
    `;
    
    // Mock state functions
    jest.spyOn(stateModule, 'getIsRealTime').mockReturnValue(false);
    jest.spyOn(stateModule, 'subscribeToCurrentTime').mockImplementation(() => {});
    jest.spyOn(stateModule, 'subscribeToRealTime').mockImplementation(() => {});
    jest.spyOn(stateModule, 'getCurrentTime').mockReturnValue(new Date('2025-01-01T12:00:00Z'));
    jest.spyOn(stateModule, 'setCurrentTime').mockImplementation(() => {});
    jest.spyOn(stateModule, 'setIsRealTime').mockImplementation(() => {});
    jest.spyOn(stateModule, 'saveState').mockImplementation(() => {});
    
    // Clear mocks
    jest.clearAllMocks();
    
    setupTimeInputControl();
  });

  test('time input is initialized with current state value', () => {
    const input = document.getElementById('current-time');
    // Should be initialized with the mocked current time
    expect(input.value).toBeTruthy();
    expect(input.value).toContain('2025-01-01T'); // Just check date part, time varies by timezone
  });

  test('time input change updates state and saves', () => {
    const input = document.getElementById('current-time');
    input.value = '2025-01-01T15:30';
    
    const event = new Event('change');
    input.dispatchEvent(event);
    
    // Should call setCurrentTime with the new time
    expect(stateModule.setCurrentTime).toHaveBeenCalledWith(new Date('2025-01-01T15:30'));
    
    // Should save state
    expect(stateModule.saveState).toHaveBeenCalled();
    
    // Should NOT directly update radar or branding - let state subscribers handle it
    expect(radarModule.updateRadarTMSLayer).not.toHaveBeenCalled();
    expect(brandingModule.updateBrandingOverlay).not.toHaveBeenCalled();
  });

  test('invalid time input is ignored', () => {
    const input = document.getElementById('current-time');
    input.value = 'invalid-date';
    
    const event = new Event('change');
    input.dispatchEvent(event);
    
    // Should not call any update functions for invalid date
    expect(stateModule.setCurrentTime).not.toHaveBeenCalled();
    expect(stateModule.saveState).not.toHaveBeenCalled();
  });

  test('input does not update while user is typing', () => {
    const input = document.getElementById('current-time');
    
    // Initial value should be set from current state
    expect(input.value).toBeTruthy();
    const initialValue = input.value;
    
    // Simulate user starting to type
    input.focus();
    input.dispatchEvent(new Event('focus'));
    
    // Mock a state change that would normally update the input
    const callback = stateModule.subscribeToCurrentTime.mock.calls[0][0];
    const testTime = new Date('2025-01-01T20:00:00Z');
    callback(testTime);
    
    // Input should not have been updated while focused
    expect(input.value).toBe(initialValue); // Should remain unchanged
    
    // When user finishes editing
    input.blur();
    input.dispatchEvent(new Event('blur'));
    
    // Now it should update (check that value was actually set, exact format may vary by timezone)
    expect(input.value).toBeTruthy();
    expect(input.value).toContain('2025-01-01');
  });

  test('empty input is ignored', () => {
    const input = document.getElementById('current-time');
    input.value = '';
    
    const event = new Event('change');
    input.dispatchEvent(event);
    
    // Should not call any update functions for empty input
    expect(stateModule.setCurrentTime).not.toHaveBeenCalled();
    expect(stateModule.saveState).not.toHaveBeenCalled();
  });

  test('step time buttons update state and save', () => {
    const stepForwardButton = document.getElementById('time-step-forward');
    
    stepForwardButton.click();
    
    // Should call setCurrentTime
    expect(stateModule.setCurrentTime).toHaveBeenCalled();
    
    // Should save state
    expect(stateModule.saveState).toHaveBeenCalled();
    
    // Should NOT directly update components - let state subscribers handle it
    expect(radarModule.updateRadarTMSLayer).not.toHaveBeenCalled();
    expect(brandingModule.updateBrandingOverlay).not.toHaveBeenCalled();
  });
});
