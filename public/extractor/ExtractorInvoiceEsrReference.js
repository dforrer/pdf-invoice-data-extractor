// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the ESR reference from the pdf text
 * @class
 */
class ExtractorInvoiceEsrReference extends Extractor {
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
        var pattern = /(\d{5,27})\+/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        var r = {};
        r.value = value.g1;
        r.match = value.g1;
        r.position = value.i;
        return r;
    }
}

module.exports = ExtractorInvoiceEsrReference;
