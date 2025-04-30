import '@testing-library/jest-dom';

beforeEach(() => {
    // Mock localStorage
    const store = {};
    const storageMock = {
        getItem: jest.fn(key => store[key] ?? null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => {
                delete store[key];
            });
        })
    };
    Object.defineProperty(global, 'localStorage', {
        value: storageMock,
        writable: true
    });

    // Mock Date to return fixed date
    const FIXED_DATE = new Date('2025-01-01T00:00:00.000Z');
    const RealDate = Date;
    class MockDate extends RealDate {
        constructor(...args) {
            if (args.length) {
                return new RealDate(...args);
            }
            return FIXED_DATE;
        }
    }
    MockDate.now = () => FIXED_DATE.getTime();
    global.Date = MockDate;
});