import { WebcamWindow } from '../src/webcamWindow';
import { webcamRegistry } from '../src/webcamRegistry';

jest.mock('../src/state.js', () => ({
    getIsRealTime: jest.fn(() => false),
    getCurrentTime: jest.fn(() => new Date('2025-01-01T12:34:00Z').getTime())
}));

jest.mock('../src/webcamRegistry.js', () => ({
    webcamRegistry: {
        registerWindow: jest.fn(),
        unregisterWindow: jest.fn()
    }
}));

describe('WebcamWindow', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should import WebcamWindow class', () => {
        expect(typeof WebcamWindow).toBe('function');
        expect(WebcamWindow.name).toBe('WebcamWindow');
    });

    it('renders and opens the window with a timestamped title', () => {
        new WebcamWindow({
            src: 'https://example.com/cam.jpg',
            title: 'Test Cam'
        });

        const windowEl = document.querySelector('.webcam-window');
        expect(windowEl).toBeTruthy();
        expect(windowEl.classList.contains('open')).toBe(false);

        jest.advanceTimersByTime(20);
        expect(windowEl.classList.contains('open')).toBe(true);

        const title = windowEl.querySelector('.webcam-window-title');
        expect(title.textContent).toContain('Test Cam');
        expect(title.textContent).toContain('@');
    });

    it('closes and removes the window on close click', () => {
        new WebcamWindow({
            src: 'https://example.com/cam.jpg',
            title: 'Closable Cam',
            cid: 'C001'
        });

        jest.advanceTimersByTime(20);

        const windowEl = document.querySelector('.webcam-window');
        const closeButton = windowEl.querySelector('.webcam-window-close');
        closeButton.click();

        jest.advanceTimersByTime(310);
        expect(document.querySelector('.webcam-window')).toBeNull();
        expect(webcamRegistry.unregisterWindow).toHaveBeenCalledWith('C001');
    });

    it('toggles loading and error states on image events', () => {
        const instance = new WebcamWindow({
            src: 'https://example.com/cam.jpg',
            title: 'Load Test'
        });

        const windowEl = document.querySelector('.webcam-window');
        const loading = windowEl.querySelector('.webcam-loading');
        const error = windowEl.querySelector('.webcam-error');

        instance.refresh();
        expect(loading.style.display).toBe('block');

        instance.image.dispatchEvent(new Event('error'));
        expect(error.style.display).toBe('block');

        instance.image.dispatchEvent(new Event('load'));
        expect(error.style.display).toBe('none');
        expect(loading.style.display).toBe('none');
    });

    it('switches views when the selector changes', () => {
        new WebcamWindow({
            src: 'https://example.com/front.jpg',
            title: 'Views',
            views: {
                Front: 'https://example.com/front.jpg',
                Side: 'https://example.com/side.jpg'
            }
        });

        const windowEl = document.querySelector('.webcam-window');
        const select = windowEl.querySelector('.webcam-view-select');
        select.value = 'Side';
        select.dispatchEvent(new Event('change'));

        const image = windowEl.querySelector('.webcam-image');
        expect(image.src).toContain('side.jpg');
    });

    it('updates view list and falls back when current view is removed', () => {
        const instance = new WebcamWindow({
            src: 'https://example.com/front.jpg',
            title: 'Update Views',
            views: {
                Front: 'https://example.com/front.jpg',
                Side: 'https://example.com/side.jpg'
            }
        });

        instance.currentView = 'Side';
        instance.updateViews({
            Front: 'https://example.com/front.jpg'
        });

        expect(instance.currentView).toBe('Front');
        expect(instance.image.src).toContain('front.jpg');
    });
});
