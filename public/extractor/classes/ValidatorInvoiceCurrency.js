// Requirements

/**
 * Validates the invoice currency and returns a JS-object
 * @class
 */
class ValidatorInvoiceCurrency {

    constructor() {}

    /**
     * Validation function
     * e.g. rv = {   input: "chf",
     *              output: "CHF",
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
        str = str.replace( / /gm, '' );
        if ( /chf|sfr|fr/gi.test( str ) ) {
            rv.output = 'CHF';
        } else if ( /eur|€/gi.test( str ) ) {
            rv.output = 'EUR';
        } else if ( /usd|\$/gi.test( str ) ) {
            rv.output = 'USD';
        } else if ( /gbp|£/gi.test( str ) ) {
            rv.output = 'GBP';
        } else {
            rv.output = rv.input;
            rv.valid = false;
        }
        return rv;
    }
}

module.exports = ValidatorInvoiceCurrency;
