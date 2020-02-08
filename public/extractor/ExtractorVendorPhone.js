// Requirements
let Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor phone number from the pdf text
 * @class
 */
class ExtractorVendorPhone extends Extractor {
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
        let pattern = /((tel.{0,12})?(\+\d{2}) (\(?\d{1,2}\))?\d{2,3} \d{3} \d{2} \d{2})|((tel.{0,9})?\d{2,3} ?\d{3} \d{2} \d{2})/gim;
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
        r.value = value.g1.replace( /\+/gi, '00' )
            .replace( /\D/gi, '' );
        r.position = value.i;
        return r;
    }
}

module.exports = ExtractorVendorPhone;
