// Requirements
let Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor email from the pdf text
 * @class
 */
class ExtractorVendorEmail extends Extractor {
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
        let pattern = /\b((?:(?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@(?:(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(?:(?:[a-zA-Z\-0-9]+(?:\.))+[a-zA-Z]{2,})))\b/gim;
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
        r.value = value.g1;
        r.position = value.i;
        return r;
    }
}

module.exports = ExtractorVendorEmail;
