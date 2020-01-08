// Requirements
const util = require('./util.js');

/**
 * Validation function for date values
 * e.g. rv = {   input: "01012019",
 *              output: "01.01.2019",
 *               valid: true,
 *             default: false };
 * @param {string} str
 * @returns {object} rv
 */

function validate ( str ) {
    var rv = { input: str, valid: true, default: false };
    var whitelist = '1234567890\./\\- ';
    var flags = 'gm';
    str = str.trim(); // remove leading and trailing spaces
    var str2 = util.removeChars( whitelist, str, flags );
    if ( /\b\d?\d(\.|\/| |-)\d?\d(\.|\/| |-)(\d\d)?\d\d\b/gi.test( str2 ) ) {
        var dmy = str2.split( /[\.|\/| |-]+/ );
        var dd   = dmy[0].padStart(2, '0');
        var mm   = dmy[1].padStart(2, '0');
        var yyyy = dmy[2];
        if ( yyyy.length === 2 ) {
            yyyy = '20' + yyyy;
        }
        rv.output = dd + '.' + mm  + '.' + yyyy;
    } else if ( str.length === 8 && /\b\d\d\d\d\d\d\d\d\b/gi.test( str ) ) {
        var dd   = str.substring( 0, 2 );
        var mm   = str.substring( 2, 4 );
        var yyyy = str.substring( 4 );
        rv.output = dd + '.' + mm  + '.' + yyyy;
    } else if ( str.length === 6 && /\b\d\d\d\d\d\d\b/gi.test( str ) ) {
        var dd   = str.substring( 0, 2 );
        var mm   = str.substring( 2, 4 );
        var yy = str.substring( 4 );
        rv.output = dd + '.' + mm  + '.' + '20' + yy;
    } else {
        rv.output = rv.input;
        rv.valid = false;
    }
    return rv;
}

module.exports = {
    validate
}
