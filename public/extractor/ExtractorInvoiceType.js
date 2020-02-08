// Requirements
let Extractor = require( './Extractor.js' );

/**
 * Extracts the invoice date from the pdf text
 * @class
 */
class ExtractorInvoiceType extends Extractor {
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
        let pattern = /(?:\b(?:Ausgangs)?(R)(?:echnung))|(?:\b(R)(?:g\.\b))|(?:\b(R)g\b)|(?:\b(I)nvoice)|(?:\bFaktu(r)a)|(?:\bFactu(r)e)|(?:\b(G)utschrift)|(?:\b(C)redit note)|(?:\b(c)rédit)/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        let r = {};
        switch ( value.g1 ) {
            case "G":
            case "g":
            case "C":
            case "c":
                r.value = "G";
                break;
            case "R":
            case "I":
            case "r":
            case "i":
            default:
                r.value = "R";
                break;
        }
        r.match = key;
        r.position = value.i;
        return r;
    }

    /**
     * @param {Object} obj
     * @returns {Array} arr
     * @private
     */
    iterateMatchesCleanup( obj ) {
        let arr = super.iterateMatchesCleanup( obj );
        // set default value
        if ( arr.length === 0 ) {
            arr.push( {
                match: "",
                position: 0,
                value: "R"
            } );
        }
        return arr;
    }
}

module.exports = ExtractorInvoiceType;
