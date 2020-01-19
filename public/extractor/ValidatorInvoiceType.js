// Requirements

/**
 * Validates the invoice type and returns a JS-object
 * @class
 */
class ValidatorInvoiceType {

    constructor() {}

    /**
     * Validation function
     * e.g. rv = {   input: "Rechnung",
     *              output: "R",
     *               valid: true,
     *             default: false };
     * @param {string} str
     * @returns {object} rv
     */
    validate( str ) {
        var rv = {
            input: str,
            valid: true,
            default: false
        };
        if ( 'R' === str.toUpperCase() || /rechnung|rg|invoice|faktur|factur/gi.test( str ) ) {
            rv.output = 'R';
        } else if ( 'G' === str.toUpperCase() || /gutschrift|credit note|credit|crédit/gi.test( str ) ) {
            rv.output = 'G';
        } else {
            // default value
            rv.output = 'R';
            rv.default = true;
        }
        return rv;
    }
}

module.exports = ValidatorInvoiceType;
