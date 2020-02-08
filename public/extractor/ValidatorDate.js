// Requirements
const util = require( './util.js' );

/**
 * Validates a date string and returns a JS-object
 * @class
 */
class ValidatorDate {

    constructor() {}

    /**
     * Validation function for date values
     * e.g. rv = {   input: "01012019",
     *              output: "01.01.2019",
     *               valid: true,
     *             default: false };
     * @param {string} str
     * @returns {object} rv
     */
    validate( str ) {
        let rv = {
            input: str,
            valid: true,
            default: false
        };
        let whitelist = '1234567890\./\\- ';
        let flags = 'gm';
        str = str.trim(); // remove leading and trailing spaces
        let str2 = util.removeChars( whitelist, str, flags );
        if ( /\b\d?\d(\.|\/| |-)\d?\d(\.|\/| |-)(\d\d)?\d\d\b/gi.test( str2 ) ) {
            let dmy = str2.split( /[\.|\/| |-]+/ );
            let dd = dmy[ 0 ].padStart( 2, '0' );
            let mm = dmy[ 1 ].padStart( 2, '0' );
            let yyyy = dmy[ 2 ];
            if ( yyyy.length === 2 ) {
                yyyy = '20' + yyyy;
            }
            rv.output = dd + '.' + mm + '.' + yyyy;
        } else if ( str.length === 8 && /\b\d\d\d\d\d\d\d\d\b/gi.test( str ) ) {
            let dd = str.substring( 0, 2 );
            let mm = str.substring( 2, 4 );
            let yyyy = str.substring( 4 );
            rv.output = dd + '.' + mm + '.' + yyyy;
        } else if ( str.length === 6 && /\b\d\d\d\d\d\d\b/gi.test( str ) ) {
            let dd = str.substring( 0, 2 );
            let mm = str.substring( 2, 4 );
            let yy = str.substring( 4 );
            rv.output = dd + '.' + mm + '.' + '20' + yy;
        } else {
            rv.output = rv.input;
            rv.valid = false;
        }
        return rv;
    }
}

module.exports = ValidatorDate;
