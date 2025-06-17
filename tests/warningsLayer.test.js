import { 
    getActivePhenomenaSignificance, 
    createWarningPopup, 
    createWarningsLayer, 
    getWarningsLayer, 
    updateWarningsLayer 
} from '../src/warningsLayer';

describe('WarningsLayer', () => {
    it('should import getActivePhenomenaSignificance function', () => {
        expect(typeof getActivePhenomenaSignificance).toBe('function');
    });

    it('should import createWarningPopup function', () => {
        expect(typeof createWarningPopup).toBe('function');
    });

    it('should import createWarningsLayer function', () => {
        expect(typeof createWarningsLayer).toBe('function');
    });

    it('should import getWarningsLayer function', () => {
        expect(typeof getWarningsLayer).toBe('function');
    });

    it('should import updateWarningsLayer function', () => {
        expect(typeof updateWarningsLayer).toBe('function');
    });
});
