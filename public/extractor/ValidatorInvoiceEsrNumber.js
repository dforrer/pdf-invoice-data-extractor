// Requirements
const util = require( './util.js' );

/**
 * Validates an ESR number and returns a JS-object
 * @class
 */
class ValidatorInvoiceEsrNumber {

    constructor() {}

    /**
     * Validation function
     * e.g. rv = {   input: "RE 106 888",
     *              output: "RE106888",
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
        let whitelist = '1234567890-';
        let flags = 'gm';
        rv.output = util.removeChars( whitelist, str, flags );
        return rv;
    }
}

module.exports = ValidatorInvoiceEsrNumber;
