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
        let matches = this.extractRegex( this.pdf_text );
        let matches_clean = this.iterateMatchesCleanup( matches );
        return matches_clean.slice( 0, 5 ); // keep only the top 5 matches
    }

    /**
     * @param {string} str
     * @returns {Object} rv
     */
    extractRegex( str ) {
        // NEEDS TO BE OVERWRITTEN IN SUBCLASS
    }

    /**
     * @param {Object} obj
     * @returns {Array} arr
     * @private
     */
    iterateMatchesCleanup( obj ) {
        let arr = [];
        for ( const p of Object.entries( obj ) ) {
            let key = p[ 0 ];
            let value = p[ 1 ];
            let r = this.cleanup( key, value );
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
        let rv = {};
        let match = pattern.exec( str );
        while ( match != null ) {
            let entry = {
                i: match.index
            }; // index
            // remove undefined results from array
            match = match.filter( function( el ) {
                return el != null;
            } );

            entry.g1 = match[ 1 ]; // group 1
            match[ 2 ] != undefined ? entry.g2 = match[ 2 ] : 1; // group 2
            match[ 3 ] != undefined ? entry.g3 = match[ 3 ] : 1; // group 3
            let m = match[ 0 ].trim();
            if ( !rv[ m ] ) {
                // key doesn't exist yet
                rv[ m ] = entry;
            }
            match = pattern.exec( str );
        }
        return rv;
    }
}

module.exports = Extractor;
