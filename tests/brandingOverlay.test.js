import { updateAnimationBranding, updateBrandingOverlay } from '../src/brandingOverlay';

// Mock dependencies
jest.mock('../src/state', () => ({
    getCurrentTime: jest.fn(() => new Date('2025-01-15T10:35:00.000Z')),
    getIsRealTime: jest.fn(() => true),
    subscribeToRealTime: jest.fn(),
    subscribeToCurrentTime: jest.fn()
}));

jest.mock('../src/utils', () => ({
    rectifyToFiveMinutes: jest.fn(date => {
        const rectified = new Date(date.getTime());
        rectified.setUTCMinutes(30);
        rectified.setUTCSeconds(0);
        return rectified;
    })
}));

jest.mock('strftime', () => jest.fn((fmt, date) => {
    if (fmt === '%-I:%M %p') {
        return '10:30 AM';
    }
    return 'formatted-time';
}));

jest.mock('iemjs/domUtils', () => ({
    requireElement: jest.fn(() => ({
        dataset: {},
        textContent: ''
    }))
}));

describe('BrandingOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateAnimationBranding', () => {
        it('should import updateAnimationBranding function', () => {
            expect(typeof updateAnimationBranding).toBe('function');
        });

        it('should update branding overlay for animation mode', () => {
            const mockElement = {
                dataset: {},
                textContent: ''
            };
            
            const { requireElement } = require('iemjs/domUtils');
            requireElement.mockReturnValue(mockElement);

            const radarTime = new Date('2025-01-15T10:32:00.000Z');
            updateAnimationBranding(radarTime);

            expect(mockElement.dataset.mode).toBe('archive');
            expect(mockElement.textContent).toContain('IEM1: Archive (Animating)');
            expect(mockElement.textContent).toContain('RADAR:');
            expect(mockElement.textContent).toContain('Warnings:');
        });
    });

    describe('updateBrandingOverlay', () => {
        it('should import updateBrandingOverlay function', () => {
            expect(typeof updateBrandingOverlay).toBe('function');
        });

        it('should update branding overlay for realtime mode', () => {
            const mockElement = {
                dataset: {},
                textContent: ''
            };
            
            const { requireElement } = require('iemjs/domUtils');
            const { getIsRealTime } = require('../src/state');
            
            requireElement.mockReturnValue(mockElement);
            getIsRealTime.mockReturnValue(true);

            updateBrandingOverlay();

            expect(mockElement.dataset.mode).toBe('realtime');
            expect(mockElement.textContent).toContain('IEM1: Realtime');
        });

        it('should update branding overlay for archive mode', () => {
            const mockElement = {
                dataset: {},
                textContent: ''
            };
            
            const { requireElement } = require('iemjs/domUtils');
            const { getIsRealTime } = require('../src/state');
            
            requireElement.mockReturnValue(mockElement);
            getIsRealTime.mockReturnValue(false);

            updateBrandingOverlay();

            expect(mockElement.dataset.mode).toBe('archive');
            expect(mockElement.textContent).toContain('IEM1: Archive');
        });
    });
});
