import {
  isAnimating,
  pauseAnimation,
  setArchiveTime,
  setRealtimeMode,
  stopAnimation,
  subscribeToAnimationState,
  toggleAnimation,
} from '../src/timelineController';
import * as radarModule from '../src/radarTMSLayer';
import * as ridgeModule from '../src/ridgeRadarLayer';
import * as stateModule from '../src/state';
import * as brandingModule from '../src/brandingOverlay';

jest.mock('../src/radarTMSLayer', () => ({
  updateRadarTMSLayer: jest.fn(),
  resetRadarTMSLayer: jest.fn(),
}));

jest.mock('../src/ridgeRadarLayer', () => ({
  getRidgeScansForAnimation: jest.fn(() => []),
  isRidgeActive: jest.fn(() => false),
  updateRidgeForTime: jest.fn(),
}));

jest.mock('../src/state', () => ({
  getCurrentTime: jest.fn(() => new Date('2025-01-01T12:00:00Z')),
  getIsRealTime: jest.fn(() => false),
  saveState: jest.fn(),
  setCurrentTime: jest.fn(),
  setIsRealTime: jest.fn(),
}));

jest.mock('../src/brandingOverlay', () => ({
  updateAnimationBranding: jest.fn(),
  updateBrandingOverlay: jest.fn(),
}));

describe('timelineController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    stopAnimation();
  });

  afterEach(() => {
    stopAnimation();
    jest.useRealTimers();
  });

  test('realtime animate -> pause -> animate works cleanly', () => {
    stateModule.getIsRealTime.mockReturnValue(true);

    const started = toggleAnimation();
    expect(started).toBe(true);
    expect(isAnimating()).toBe(true);

    jest.advanceTimersByTime(1000);
    expect(radarModule.updateRadarTMSLayer).toHaveBeenCalledTimes(1);
    expect(brandingModule.updateAnimationBranding).toHaveBeenCalledTimes(1);

    const paused = toggleAnimation();
    expect(paused).toBe(false);
    expect(isAnimating()).toBe(false);
    expect(radarModule.resetRadarTMSLayer).not.toHaveBeenCalled();
    expect(brandingModule.updateBrandingOverlay).not.toHaveBeenCalled();

    const restarted = toggleAnimation();
    expect(restarted).toBe(true);
    expect(isAnimating()).toBe(true);

    jest.advanceTimersByTime(1000);
    expect(radarModule.updateRadarTMSLayer).toHaveBeenCalledTimes(2);
    expect(brandingModule.updateAnimationBranding).toHaveBeenCalledTimes(2);
  });

  test('pause preserves timeline progress for resume', () => {
    const callback = jest.fn();
    subscribeToAnimationState(callback);

    toggleAnimation();
    jest.advanceTimersByTime(2000);

    pauseAnimation();
    const latestCall = callback.mock.calls[callback.mock.calls.length - 1][0];
    expect(latestCall.isAnimating).toBe(false);
    expect(latestCall.progress).toBeGreaterThan(0);
  });

  test('setArchiveTime stops animation before setting time', () => {
    toggleAnimation();
    expect(isAnimating()).toBe(true);

    const targetTime = new Date('2025-01-01T15:30:00Z');
    setArchiveTime(targetTime);

    expect(isAnimating()).toBe(false);
    expect(stateModule.setCurrentTime).toHaveBeenCalledWith(targetTime);
    expect(stateModule.saveState).toHaveBeenCalledTimes(1);
    expect(radarModule.resetRadarTMSLayer).toHaveBeenCalledTimes(1);
    expect(brandingModule.updateBrandingOverlay).toHaveBeenCalledTimes(1);
  });

  test('stopAnimation fully resets timeline and view', () => {
    toggleAnimation();
    jest.advanceTimersByTime(1000);

    const stopped = stopAnimation();

    expect(stopped).toBe(true);
    expect(isAnimating()).toBe(false);
    expect(radarModule.resetRadarTMSLayer).toHaveBeenCalledTimes(1);
    expect(brandingModule.updateBrandingOverlay).toHaveBeenCalledTimes(1);
  });

  test('setRealtimeMode forces realtime and persists state', () => {
    setRealtimeMode();

    expect(stateModule.setIsRealTime).toHaveBeenCalledWith(true);
    expect(stateModule.saveState).toHaveBeenCalledTimes(1);
  });

  test('animation state subscribers receive progress updates', () => {
    const callback = jest.fn();
    subscribeToAnimationState(callback);

    toggleAnimation();
    jest.advanceTimersByTime(1000);

    const latestCall = callback.mock.calls[callback.mock.calls.length - 1][0];
    expect(latestCall.isAnimating).toBe(true);
    expect(latestCall.progress).toBeGreaterThan(0);
  });

  test('ridge animation uses scan timestamps when available', () => {
    ridgeModule.isRidgeActive.mockReturnValue(true);
    ridgeModule.getRidgeScansForAnimation.mockReturnValue([
      { ts: '2025-01-01T11:55:00Z' },
      { ts: '2025-01-01T12:00:00Z' },
    ]);

    toggleAnimation();
    jest.advanceTimersByTime(1000);

    const frameTime = radarModule.updateRadarTMSLayer.mock.calls[0][0];
    expect(frameTime.toISOString()).toBe('2025-01-01T11:55:00.000Z');
    expect(ridgeModule.updateRidgeForTime).toHaveBeenCalledTimes(1);
  });
});
