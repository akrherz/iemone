import { updateRadarTMSLayer, resetRadarTMSLayer } from './radarTMSLayer';
import {
    getCurrentTime,
    getIsRealTime,
    saveState,
    setCurrentTime,
    setIsRealTime,
} from './state';
import {
    getRidgeScansForAnimation,
    isRidgeActive,
    updateRidgeForTime,
} from './ridgeRadarLayer';
import { updateAnimationBranding, updateBrandingOverlay } from './brandingOverlay';

const DEFAULT_ANIMATION_FRAMES = 12;
const ANIMATION_STEP_MS = 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const FIFTY_FIVE_MINUTES_MS = 55 * 60 * 1000;

const animationSubscribers = [];

let animationInterval = null;
let animationScans = [];
let animationBaseTime = null;
let animationStep = 0;
let animationTotalSteps = DEFAULT_ANIMATION_FRAMES;

function getAnimationProgress() {
    return animationTotalSteps > 0
        ? (animationStep / animationTotalSteps) * 100
        : 0;
}

function notifyAnimationSubscribers() {
    const state = {
        isAnimating: isAnimating(),
        progress: getAnimationProgress(),
    };
    animationSubscribers.forEach((callback) => callback(state));
}

export function subscribeToAnimationState(callback) {
    if (typeof callback === 'function') {
        animationSubscribers.push(callback);
        callback({ isAnimating: isAnimating(), progress: getAnimationProgress() });
    }
}

function resetAnimationState() {
    animationScans = [];
    animationBaseTime = null;
    animationStep = 0;
    animationTotalSteps = DEFAULT_ANIMATION_FRAMES;
}

function getFrameTime() {
    if (animationScans.length > 0) {
        return new Date(animationScans[animationStep].ts);
    }

    const baseTime = getIsRealTime() ? getCurrentTime() : animationBaseTime;
    return new Date(
        baseTime.getTime() - FIFTY_FIVE_MINUTES_MS + animationStep * FIVE_MINUTES_MS
    );
}

function runAnimationTick() {
    if (animationStep >= animationTotalSteps) {
        animationStep = 0;
    }

    const frameTime = getFrameTime();
    updateRadarTMSLayer(frameTime);
    if (isRidgeActive()) {
        updateRidgeForTime(frameTime);
    }
    updateAnimationBranding(frameTime);

    animationStep += 1;
    notifyAnimationSubscribers();
}

export function isAnimating() {
    return animationInterval !== null;
}

export function pauseAnimation() {
    if (!isAnimating()) {
        return false;
    }

    clearInterval(animationInterval);
    animationInterval = null;
    notifyAnimationSubscribers();
    return true;
}

export function stopAnimation() {
    const hadAnimationState = isAnimating() || animationBaseTime !== null || animationStep > 0;
    if (!hadAnimationState) {
        return false;
    }

    if (isAnimating()) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    resetAnimationState();

    resetRadarTMSLayer();
    updateBrandingOverlay();
    notifyAnimationSubscribers();
    return true;
}

export function startAnimation() {
    if (isAnimating()) {
        return false;
    }

    if (animationBaseTime === null) {
        animationScans = isRidgeActive() ? getRidgeScansForAnimation(DEFAULT_ANIMATION_FRAMES) : [];
        animationBaseTime = getCurrentTime();
        animationStep = 0;
        animationTotalSteps = animationScans.length > 0
            ? animationScans.length
            : DEFAULT_ANIMATION_FRAMES;
    }

    animationInterval = setInterval(runAnimationTick, ANIMATION_STEP_MS);
    notifyAnimationSubscribers();
    return true;
}

export function toggleAnimation() {
    if (isAnimating()) {
        pauseAnimation();
        return false;
    }
    startAnimation();
    return true;
}

export function setRealtimeMode() {
    stopAnimation();
    setIsRealTime(true);
    saveState();
}

export function setArchiveMode() {
    stopAnimation();
    setIsRealTime(false);
    saveState();
}

export function setArchiveTime(newTime) {
    stopAnimation();
    setCurrentTime(newTime);
    saveState();
}

export function stepArchiveTime(minutes) {
    stopAnimation();
    const currentTime = getCurrentTime();
    const newTime = new Date(currentTime);
    newTime.setMinutes(currentTime.getMinutes() + minutes);
    setCurrentTime(newTime);
    saveState();
}
