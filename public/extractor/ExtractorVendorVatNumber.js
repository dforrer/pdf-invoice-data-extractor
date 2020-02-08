// Requirements
let Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor vat number from the pdf text
 * @class
 */
class ExtractorVendorVatNumber extends Extractor {
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
        let pattern = /((?:(?:CHE)(?:-|\s)?)\d{3}(?:\.|\s)?\d{3}(?:\.|\s)?\d{3})(?: |\t)?/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        let r = {};
        r.match = key;
        r.value = value.g1.replace( /-/gi, '' )
            .replace( /\./gi, '' )
            .replace( /\s/gi, '' );
        r.position = value.i;
        return r;
    }
}

module.exports = ExtractorVendorVatNumber;
