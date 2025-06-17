import { showToaster } from '../src/toaster';

// Mock the DOM element
jest.mock('iemjs/domUtils', () => ({
    requireElement: jest.fn(() => ({
        textContent: '',
        style: { display: 'none' }
    }))
}));

describe('Toaster', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('showToaster', () => {
        it('should import showToaster function', () => {
            expect(typeof showToaster).toBe('function');
        });

        it('should display message and hide after timeout', () => {
            const mockElement = {
                textContent: '',
                style: { display: 'none' }
            };
            
            const { requireElement } = require('iemjs/domUtils');
            requireElement.mockReturnValue(mockElement);

            showToaster('Test message');
            
            expect(mockElement.textContent).toBe('Test message');
            expect(mockElement.style.display).toBe('block');
            
            // Fast-forward time
            jest.advanceTimersByTime(3000);
            
            expect(mockElement.style.display).toBe('none');
        });
    });
});
