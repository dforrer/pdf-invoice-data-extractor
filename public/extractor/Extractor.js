// Requirements

/**
 * Base class for Extractor subclasses
 * @class
 */
class Extractor {
    /*
     * @param {string} pdf_text
     * @param {object} extracted_data
     */
    constructor( pdf_text, extracted_data ) {
        this.pdf_text = pdf_text;
        this.extracted_data = extracted_data;
    }

    //====================
    // Public methods
    //====================

    /**
     * public extract function
     * @returns {array}
     * @public
     */
    extract() {
        var matches = this.extractRegex( this.pdf_text );
        var matches_clean = this.iterate_matches_cleanup( matches );
        return this.keepTopFive( matches_clean );
    }

    /**
     * @param {string} str
     * @returns {Object} rv
     */
    extractRegex( str ) {
        // NEEDS TO BE OVERRIDDEN IN SUBCLASS
    }

    /**
     * @param {Object} obj
     * @returns {Array} arr
     * @private
     */
    iterate_matches_cleanup( obj ) {
        var arr = [];
        for ( const p of Object.entries( obj ) ) {
            var key   = p[0];
            var value = p[1];
            var r = this.cleanup( key, value );
            if ( r !== null ) {
                arr.push( r );
            }
        }
        return arr;
    }

    /**
     * @param {string} str
     * @param {regex} pattern
     * @returns {Object} rv
     */
    loopMatches( str, pattern ) {
        var rv = {};
        let match = pattern.exec(str);
        while ( match != null ) {
            var entry = { i: match.index }; // index
            // remove undefined results from array
            match = match.filter(function (el) {
                return el != null;
            });

            entry.g1 = match[1]; // group 1
            match[2] != undefined ? entry.g2 = match[2]:1; // group 2
            match[3] != undefined ? entry.g3 = match[3]:1; // group 3
            var m = match[0].trim();
            if ( !rv[m] ) {
                // key doesn't exist yet
                rv[m] = entry;
            }
            match = pattern.exec(str);
        }
        return rv;
    }

    /**
     * @param {Array} arr
     * @returns {Array}
     * @private
     */
    keepTopFive (arr) {
        return arr.slice(0,5);
    }

}
module.exports = Extractor;
