import { setupTimeInputControl } from '../src/timeInputControl';
import * as radarModule from '../src/radarTMSLayer';
import * as stateModule from '../src/state';
import * as brandingModule from '../src/brandingOverlay';

// Mock flatpickr module
jest.mock('flatpickr', () => {
  return jest.fn((element, config) => {
    const mockCalendarContainer = { tagName: 'DIV', appendChild: jest.fn() };
    
    const instance = {
      setDate: jest.fn((date) => {
        if (element && date) {
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          let hours = d.getHours();
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          element.value = `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
        }
      }),
      set: jest.fn(),
      close: jest.fn(),
      config: config,
      calendarContainer: mockCalendarContainer
    };
    
    if (config?.defaultDate) {
      instance.setDate(config.defaultDate);
    }
    
    if (config?.onReady) {
      config.onReady([], element.value, instance);
    }
    
    element._flatpickr = instance;
    element._config = config;
    
    return instance;
  });
});

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
      <input type="text" id="current-time" />
      <button id="time-step-backward"></button>
      <button id="time-step-forward"></button>
      <button id="time-play-pause"></button>
      <div id="branding-overlay"></div>
      <div id="animation-progress"></div>
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
    expect(input.value).toBeTruthy();
    expect(input.value).toContain('2025-01-01');
  });

  test('time input change updates state and saves', () => {
    const input = document.getElementById('current-time');
    const flatpickr = input._flatpickr;
    const config = input._config;
    
    const newDate = new Date('2025-01-01T15:30');
    if (config?.onChange) {
      config.onChange([newDate], input.value, flatpickr);
    }
    
    expect(stateModule.setCurrentTime).toHaveBeenCalledWith(newDate);
    expect(stateModule.saveState).toHaveBeenCalled();
    
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
    
    expect(input.value).toBeTruthy();
    const initialValue = input.value;
    
    const flatpickr = input._flatpickr;
    const config = input._config;
    
    if (config?.onOpen) {
      config.onOpen([], input.value, flatpickr);
    }
    
    const callback = stateModule.subscribeToCurrentTime.mock.calls[0][0];
    const testTime = new Date('2025-01-01T20:00:00Z');
    callback(testTime);
    
    expect(input.value).toBe(initialValue);
    
    if (config?.onClose) {
      config.onClose([], input.value, flatpickr);
    }
    
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
