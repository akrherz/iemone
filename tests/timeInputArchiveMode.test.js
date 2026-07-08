import { setupTimeInputControl } from '../src/timeInputControl';
import * as stateModule from '../src/state';
import * as timelineModule from '../src/timelineController';

// Mock flatpickr module
jest.mock('flatpickr', () => {
  return jest.fn((element, config) => {
    const mockCalendarContainer = { tagName: 'DIV', appendChild: jest.fn() };
    
    const instance = {
      setDate: jest.fn((date) => {
        if (element && date) {
          const dt = new Date(date);
          const year = dt.getFullYear();
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          let hours = dt.getHours();
          const minutes = String(dt.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          element.value = `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
        }
      }),
      set: jest.fn(),
      close: jest.fn(),
      config,
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

jest.mock('../src/timelineController', () => ({
  setArchiveMode: jest.fn(),
  setArchiveTime: jest.fn(),
  setRealtimeMode: jest.fn(),
  stepArchiveTime: jest.fn(),
  subscribeToAnimationState: jest.fn(),
  toggleAnimation: jest.fn()
}));

describe('Time Input Control - Archive Mode', () => {
  let animationStateCallback;

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

    timelineModule.subscribeToAnimationState.mockImplementation((callback) => {
      animationStateCallback = callback;
    });
    
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
    
    expect(timelineModule.setArchiveTime).toHaveBeenCalledWith(newDate);
  });

  test('invalid time input is ignored', () => {
    const input = document.getElementById('current-time');
    input.value = 'invalid-date';
    
    const event = new Event('change');
    input.dispatchEvent(event);

    expect(timelineModule.setArchiveTime).not.toHaveBeenCalled();
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

    expect(timelineModule.setArchiveTime).not.toHaveBeenCalled();
  });

  test('step time buttons update state and save', () => {
    const stepBackwardButton = document.getElementById('time-step-backward');
    const stepForwardButton = document.getElementById('time-step-forward');

    stepBackwardButton.click();
    stepForwardButton.click();

    expect(timelineModule.stepArchiveTime).toHaveBeenCalledWith(-5);
    expect(timelineModule.stepArchiveTime).toHaveBeenCalledWith(5);
  });

  test('clicking realtime when archive was loaded enters realtime', () => {
    const realtimeMode = document.getElementById('realtime-mode');

    realtimeMode.checked = true;
    realtimeMode.dispatchEvent(new Event('change'));

    expect(timelineModule.setRealtimeMode).toHaveBeenCalledTimes(1);
  });

  test('clicking archive radio calls archive transition', () => {
    const archiveMode = document.getElementById('archive-mode');

    archiveMode.checked = true;
    archiveMode.dispatchEvent(new Event('change'));

    expect(timelineModule.setArchiveMode).toHaveBeenCalledTimes(1);
  });

  test('play/pause button delegates to timeline controller', () => {
    const playPauseButton = document.getElementById('time-play-pause');

    playPauseButton.click();

    expect(timelineModule.toggleAnimation).toHaveBeenCalledTimes(1);
  });

  test('animation subscriber updates button icon and progress', () => {
    const playPauseButton = document.getElementById('time-play-pause');
    const progressBar = document.querySelector('#animation-progress .progress');

    animationStateCallback({ isAnimating: true, progress: 50 });
    expect(playPauseButton.textContent).toBe('⏸︎');
    expect(progressBar.style.width).toBe('50%');

    animationStateCallback({ isAnimating: false, progress: 90 });
    expect(playPauseButton.textContent).toBe('⏵︎');
    expect(progressBar.style.width).toBe('90%');
  });
});
