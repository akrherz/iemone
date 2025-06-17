import { formatTimestampToUTC, rectifyToFiveMinutes } from '../src/utils';

describe('Utils', () => {
    describe('formatTimestampToUTC', () => {
        it('should format date to UTC timestamp string', () => {
            const date = new Date('2025-01-15T10:30:45.123Z');
            const result = formatTimestampToUTC(date);
            expect(result).toBe('202501151030');
        });

        it('should pad single digits with zeros', () => {
            const date = new Date('2025-01-05T08:05:00.000Z');
            const result = formatTimestampToUTC(date);
            expect(result).toBe('202501050805');
        });
    });

    describe('rectifyToFiveMinutes', () => {
        it('should round down to nearest 5-minute interval', () => {
            const date = new Date('2025-01-15T10:32:45.123Z');
            const result = rectifyToFiveMinutes(date);
            expect(result.getUTCMinutes()).toBe(30);
            expect(result.getUTCSeconds()).toBe(0);
        });

        it('should handle exact 5-minute intervals', () => {
            const date = new Date('2025-01-15T10:35:00.000Z');
            const result = rectifyToFiveMinutes(date);
            expect(result.getUTCMinutes()).toBe(35);
            expect(result.getUTCSeconds()).toBe(0);
        });

        it('should handle 0 minutes correctly', () => {
            const date = new Date('2025-01-15T10:02:30.000Z');
            const result = rectifyToFiveMinutes(date);
            expect(result.getUTCMinutes()).toBe(0);
        });
    });
});
