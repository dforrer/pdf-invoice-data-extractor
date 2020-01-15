// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the invoice currency from the pdf text
 * @class
 */
class ExtractorInvoiceCurrency extends Extractor {
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
        var pattern = /(\bCHF\b)|(\bEUR\b)|(\bUSD\b)|(\bGBP\b)|(€)|(\$)/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        var r = {};
        r.match = key;
        r.value = value.g1;
        if ( r.value === '$' ) {
            r.value = 'USD';
        } else if ( r.value === '€' ) {
            r.value = 'EUR';
        }
        r.position = value.i;
        return r;
    }

    /**
     * @param {Object} obj
     * @returns {Array} arr
     * @private
     */
    iterateMatchesCleanup( obj ) {
        var arr = super.iterateMatchesCleanup( obj );
        // set default value
        if ( arr.length === 0 ) {
            arr.push( {
                match: "",
                position: 0,
                value: "CHF"
            } );
        }
        return arr;
    }
}

module.exports = ExtractorInvoiceCurrency;
