import { describe, it, expect } from 'vitest';
import { extractColor, COLOR_MAP } from '../../src/utils/colors.js';
import { getCleanProductName, parseCatalogSpecs } from '../../src/utils/formatters.js';

describe('extractColor & COLOR_MAP', () => {
    it('should correctly identify Turkish Blue variants', () => {
        const res = extractColor('AJ FITNESS TURKISH (2X5)MP134/-');
        expect(res).not.toBeNull();
        expect(res.text).toBe('Turkish Blue');
        expect(res.hex).toBe('#0284c7');
        expect(res.originalTokens).toContain('TURKISH');

        const trk = extractColor('VERTEX 1234 TRK (6X9)');
        expect(trk).not.toBeNull();
        expect(trk.text).toBe('Turkish Blue');

        const tblu = extractColor('EEKEN 555 T.BLU (6X10)');
        expect(tblu).not.toBeNull();
        expect(tblu.text).toBe('Turkish Blue');
    });

    it('should correctly identify Forest Green variants (FGRN, F.GRN, FGN, F GREEN)', () => {
        const c1 = extractColor('CUBIX 60538 FGRN(5X9)MRP323/-');
        expect(c1).not.toBeNull();
        expect(c1.text).toBe('Forest Green');

        const c2 = extractColor('AJ ECO PLUS 15 F.GRN(6X9)MRP179/-');
        expect(c2).not.toBeNull();
        expect(c2.text).toBe('Forest Green');

        const c3 = extractColor('EEKEN 16230 GNT FGN(6X10)MRP635/-');
        expect(c3).not.toBeNull();
        expect(c3.text).toBe('Forest Green');

        const c4 = extractColor('CBX 50510 F GREEN (5X9) MRP.369/-');
        expect(c4).not.toBeNull();
        expect(c4.text).toBe('Forest Green');
    });

    it('should correctly identify Full White and Full Black', () => {
        const fwt1 = extractColor('EEKEN 2164 GNTS FWT(6X10) MRP339/-');
        expect(fwt1).not.toBeNull();
        expect(fwt1.text).toBe('Full White');
        expect(fwt1.hex).toBe('#ffffff');

        const fwt2 = extractColor('AGRA NIKE F.WHT(6X10)RS.340/-');
        expect(fwt2).not.toBeNull();
        expect(fwt2.text).toBe('Full White');

        const fbk1 = extractColor('EEKEN 2164 GENTS FBK(6X10)  MP 339/-');
        expect(fbk1).not.toBeNull();
        expect(fbk1.text).toBe('Full Black');
        expect(fbk1.hex).toBe('#000000');

        const fbk2 = extractColor('CBX 60618 F.BLK(5X9)MRP309/-');
        expect(fbk2).not.toBeNull();
        expect(fbk2.text).toBe('Full Black');
    });

    it('should correctly map BRB, BRT, BNR, BRN according to user specification', () => {
        // BRB is Brown Black
        const brb = extractColor('PARAGON FBR 9183 BRB(6X10)MRP560/-');
        expect(brb).not.toBeNull();
        expect(brb.text).toBe('Brown Black');
        expect(brb.hex).toBe('#78350f');
        expect(brb.gradient).toBe('linear-gradient(135deg, #78350f 50%, #1f2937 50%)');

        // BRT is Brown Tan
        const brt = extractColor('EEKEN 2141 GENTS BRT(6X10) MRP359/-');
        expect(brt).not.toBeNull();
        expect(brt.text).toBe('Brown Tan');
        expect(brt.hex).toBe('#78350f');
        expect(brt.gradient).toBe('linear-gradient(135deg, #78350f 50%, #d4a373 50%)');

        // BNR is Brown Red (not barn red)
        const bnr = extractColor('VERTEX 650006 BNR(6X10)MRP259/-');
        expect(bnr).not.toBeNull();
        expect(bnr.text).toBe('Brown Red');
        expect(bnr.hex).toBe('#78350f');
        expect(bnr.gradient).toBe('linear-gradient(135deg, #78350f 50%, #ef4444 50%)');

        // BRN is Brown
        const brn = extractColor('ACTION AQUA BRN(7X10)MRP233/-');
        expect(brn).not.toBeNull();
        expect(brn.text).toBe('Brown');
        expect(brn.hex).toBe('#78350f');
    });

    it('should correctly identify Mehandi variants (MHND, MHD, MEHANDI, MEHENDI)', () => {
        const mhnd = extractColor('ACTION POLO MHND(7X10)MRP249/-');
        expect(mhnd).not.toBeNull();
        expect(mhnd.text).toBe('Mehendi');

        const mhd = extractColor('ACTION EASY WALK (6X9) MHD MRP233/-');
        expect(mhd).not.toBeNull();
        expect(mhd.text).toBe('Mehendi');

        const meh = extractColor('Xpnia V-86 Mehandi (5*9) Mrp.289/-');
        expect(meh).not.toBeNull();
        expect(meh.text).toBe('Mehendi');
    });

    it('should correctly detect pair colors with slash or hyphen and provide gradient', () => {
        const whtBlk = extractColor('WHT-BLK SNEAKER (6X9)');
        expect(whtBlk).not.toBeNull();
        expect(whtBlk.text).toBe('White & Black');
        expect(whtBlk.gradient).toBe('linear-gradient(135deg, #94a3b8 50%, #1f2937 50%)');

        const poloPair = extractColor('DUROLITE POLO 2 BLK-WHT(6X9) MRP385/-');
        expect(poloPair).not.toBeNull();
        expect(poloPair.text).toBe('Black & White');
        expect(poloPair.gradient).toBe('linear-gradient(135deg, #1f2937 50%, #94a3b8 50%)');

        const blkRed = extractColor('CAMPUS 100 BLK/RED (7X10)');
        expect(blkRed).not.toBeNull();
        expect(blkRed.text).toBe('Black & Red');
    });

    it('should respect negative domain rules: POLO is an article name, not a color', () => {
        // If POLO has no other color, return null
        expect(extractColor('SWASTIK KIDS POLO(1X3)')).toBeNull();
        expect(extractColor('DUROLITE POLO (6X9)')).toBeNull();

        // If POLO has a real color, extract that color
        const poloBlk = extractColor('ACTION POLO BLK(6X9)MRP 249/-');
        expect(poloBlk).not.toBeNull();
        expect(poloBlk.text).toBe('Black');
    });

    it('should respect negative domain rules: MGT BLUE is an article name, not color blue', () => {
        expect(extractColor('MGT BLUE (11X13) RS.80/-')).toBeNull();
        expect(extractColor('MGT BLUE (1X3)RS.85/-')).toBeNull();
        expect(extractColor('MGT BLUE (4X7)RS.90/-')).toBeNull();
    });

    it('should handle uncolored articles by returning null', () => {
        expect(extractColor('MGT AIRPLUS(6X9)RS.120/-')).toBeNull();
        expect(extractColor('SWASTIK CRAZY (11*13)')).toBeNull();
        expect(extractColor('P-TOES 0207 GIRLS (01-03) MRP.259/-')).toBeNull();
    });

    it('should detect colors stuck to punctuation or discounts', () => {
        const brnDiscount = extractColor('Vertex 6193E Mrp279/-BRN-40%');
        expect(brnDiscount).not.toBeNull();
        expect(brnDiscount.text).toBe('Brown');

        const blkPrice = extractColor('CBX 77016 (5*9) MRP379/-BLK');
        expect(blkPrice).not.toBeNull();
        expect(blkPrice.text).toBe('Black');

        const blkParen = extractColor('ASNLITE DLX BELLY (4*6)BLK MRP345/- (45%)');
        expect(blkParen).not.toBeNull();
        expect(blkParen.text).toBe('Black');
    });
});

describe('getCleanProductName', () => {
    it('should cleanly strip color tokens while preserving article names', () => {
        expect(getCleanProductName('AJ FITNESS TURKISH (2X5)MP134/-')).toBe('Aj Fitness');
        expect(getCleanProductName('CUBIX 60538 FGRN(5X9)MRP323/-')).toBe('Cubix 60538');
        expect(getCleanProductName('DUROLITE POLO 2 BLK-WHT(6X9) MRP385/-')).toBe('Durolite Polo 2');
        expect(getCleanProductName('ACTION POLO BLK(6X9)MRP 249/-')).toBe('Action Polo');
        expect(getCleanProductName('ACTION POLO MHND(7X10)MRP249/-')).toBe('Action Polo');
        expect(getCleanProductName('SWASTIK KIDS POLO(1X3)')).toBe('Swastik Kids Polo');
        expect(getCleanProductName('MGT BLUE (11X13) RS.80/-')).toBe('Mgt Blue');
        expect(getCleanProductName('PARAGON FBR 9183 BRB(6X10)MRP560/-')).toBe('Paragon Fbr 9183');
        expect(getCleanProductName('EEKEN 2141 GENTS BRT(6X10) MRP359/-')).toBe('Eeken 2141 Gents');
        expect(getCleanProductName('VERTEX 650006 BNR(6X10)MRP259/-')).toBe('Vertex 650006');
        expect(getCleanProductName('Vertex 6193E Mrp279/-BRN-40%')).toBe('Vertex 6193e');
    });
});
