// Requirements

/**
 * Validates a vendor id and returns a JS-object
 * @class
 */
class ValidatorVendorId {

    constructor() {}

    /**
     * Validation function for vendor id
     * e.g. rv = {   input: "588",
     *              output: "588",
     *               valid: true,
     *             default: false };
     * @param {string} str
     * @returns {object} rv
     */
    validate( str, suppliers_loader ) {
        var rv = {
            input: str,
            valid: true,
            default: false
        };
        str = str.trim();
        if ( /^\d+$/gi.test( str ) ) {
            rv.output = str;
            var res = suppliers_loader.getSupplierForId( str );
            if ( res ) {
                document.getElementById( 'input_vendor_name' ).value = res.name1;
            } else {
                document.getElementById( 'input_vendor_name' ).value = '';
                rv.valid = false;
            }
        } else {
            // default value
            rv.output = rv.input;
            rv.default = false;
            rv.valid = false;
        }
        return rv;
    }
}

module.exports = ValidatorVendorId;
