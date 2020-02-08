// Requirements
let Extractor = require( './Extractor.js' );

/**
 * Extracts the invoice number from the pdf text
 * @class
 */
class ExtractorInvoiceNumber extends Extractor {
    /*
     * @param {string} pdf_text
     * @param {object} extracted_data
     */
    constructor( pdf_text, extracted_data ) {
        super( pdf_text, extracted_data );
    }

    /**
     * @param {string} str
     * @returns {Object} rv
     */
    extractRegex( str ) {
        let pattern = /(?:(?:rechnung|Rechn|faktura|Beleg|facture|invoice|Gutschrift|credit note)(?:\d|\D)?(?:\n)?(?:nummer|number|nr\.|Nr):?\s?(\d{2,16}))|(?:(?:Rechnung|Rechn|faktura|facture|invoice)(?:\D{1,16})?(\d+(?:\.|\'|-)?\d+))|(?:(?:Rechnung|faktura|facture|beleg|invoice|Gutschrift|credit note)(?:\D{1,16})?(?:\n)?(?:\D{1,6})?(?:\n)?(\d{2,16}))/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        let r = {};
        if ( /datum|date|betrag|adr|waren|empf|per.|konto|amount|ean|total|periode|kunde/gi.test( key ) ) {
            return null;
        }
        r.match = value.g1;
        r.value = value.g1.replace( /\s/gi, '' );
        r.position = value.i;
        return r;
    }
}

module.exports = ExtractorInvoiceNumber;
