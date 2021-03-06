// Requirements

/**
 * Validates an invoice number and returns a JS-object
 * @class
 */
class ValidatorInvoiceNumber {

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
        // replace all whitespace characters
        rv.output = str.replace( /\s+/g, ' ' ).trim();
        return rv;
    }
}

module.exports = ValidatorInvoiceNumber;
