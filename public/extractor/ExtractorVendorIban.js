// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor IBAN (international bank account number) from the pdf text
 * @class
 */
class ExtractorVendorIban extends Extractor {
    /*
     * @param {string} pdf_text
     * @param {object} extracted_data
     */
    constructor( pdf_text, extracted_data ) {
        super( pdf_text, extracted_data );
    }

    /**
     * @param {string} str
     * @returns {Object} rv
     */
    extractRegex( str ) {
        var pattern = /\b((?:CH|HR|LI|LV) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4}(?:[ ]?[a-zA-Z0-9]{1}))|((?:BG|BH|CR|DE|GB|GE|IE|ME|RS|VA) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4}(?:[ ]?[a-zA-Z0-9]{2}))|((?:NO) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){2}(?:[ ]?[a-zA-Z0-9]{3}))|((?:BE|BI) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){3})|((?:DK|FI|FO|GL|NL) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){3}(?:[ ]?[a-zA-Z0-9]{2}))|((?:MK|SI) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){3}(?:[ ]?[a-zA-Z0-9]{3}))|((?:AT|BA|EE|KZ|LT|LU|XK) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4})|((?:AE|GI|IL|IQ|TL) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4}(?:[ ]?[a-zA-Z0-9]{3}))|((?:AD|CZ|DZ|ES|MD|PK|RO|SA|SE|SK|TN|VG) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5})|((?:AO|CV|MZ|PT|ST) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5}(?:[ ]?[a-zA-Z0-9]{1}))|((?:IR|IS|TR) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5}(?:[ ]?[a-zA-Z0-9]{2}))|((?:BF|CF|CG|CM|EG|FR|GA|GR|IT|MC|MG|MR|SM) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5}(?:[ ]?[a-zA-Z0-9]{3}))|((?:AL|AZ|BJ|BY|CI|CY|DO|GT|HU|LB|ML|PL|SN|SV) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6})|((?:BR|PS|QA|UA) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6}(?:[ ]?[a-zA-Z0-9]{1}))|((?:JO|KW|MU) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6}(?:[ ]?[a-zA-Z0-9]{2}))|((?:MT|SC) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6}(?:[ ]?[a-zA-Z0-9]{3}))|((?:LC) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){7})\b/gm;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        var r = {};
        r.match = key;
        r.value = value.g1.replace( /\s/gi, '' );
        r.position = value.i;
        return r;
    }
}

module.exports = ExtractorVendorIban;
