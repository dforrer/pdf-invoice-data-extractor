// Requirements

/**
 * Validates an amount string and returns a JS-object
 * @class
 */
class ValidatorAmount {

    constructor() {}

    /**
     * Validation function for date values
     * e.g. rv = {   input: "2'103,40",
     *              output: "2103.40",
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
        // remove whitespace from front and end and split
        let outputSplit = str.trim().split( '' );
        if ( outputSplit[ outputSplit.length - 2 ] == ' ' ) {
            outputSplit.splice( outputSplit.length - 2 );
        }
        str = outputSplit.join( '' );
        // replace all non-digits (commas, dots, upticks) with dots
        str = str.replace( /\D/g, '.' );
        // replace all but the last dot with nothing
        let f = parseFloat( str.replace( /\.(?![^.]+$)|[^0-9.]/g, '' ) );
        // check if f is NaN and not undefined
        if ( f === NaN || !f ) {
            rv.output = rv.input;
            rv.valid = false;
        } else {
            rv.output = f.toFixed( 2 );
        }
        return rv;
    }
}

module.exports = ValidatorAmount;
