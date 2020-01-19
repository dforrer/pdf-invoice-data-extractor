// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor name from the extracted_data JSON-Object
 * Note:
 * - vendor_iban, vendor_vat_number should be extracted first
 *   (see iterateMatchesCleanup)
 * @class
 */
class ExtractorVendorName extends Extractor {
    /*
     * @param {string} pdf_text
     * @param {object} extracted_data
     */
    constructor( pdf_text, extracted_data, suppliers_loader ) {
        super( pdf_text, extracted_data );
        this.suppliers_loader = suppliers_loader;
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
        // find supplier for vendor_iban
        for ( var i = 0; i < this.extracted_data.vendor_iban.length; i++ ) {
            var ibanValue = this.extracted_data.vendor_iban[ i ].value;
            var res = this.suppliers_loader.getSupplierForIban( ibanValue );
            if ( res.posting_block == true ) {
                continue;
            }
            if ( res != 0 ) {
                // add vendor_name to extracted_data
                var vendor_name = [ {
                    match: this.extracted_data.vendor_iban[ i ].match,
                    value: res.name1,
                    position: 0
                } ];
                return vendor_name;
            }
        }

        // find supplier for vendor_vat_number
        for ( var i = 0; i < this.extracted_data.vendor_vat_number.length; i++ ) {
            var mwstValue = this.extracted_data.vendor_vat_number[ i ].value;
            var res = this.suppliers_loader.getSupplierForUid( mwstValue );
            if ( res.posting_block == true ) {
                continue;
            }
            if ( res != 0 ) {
                var vendor_name = [ {
                    match: this.extracted_data.vendor_vat_number[ i ].match,
                    value: res.name1,
                    position: 0
                } ];
                return vendor_name;
            }
        }

        var vendor_name = [ {
            match: '',
            value: '',
            position: 0
        } ];
        return vendor_name;
    }
}

module.exports = ExtractorVendorName;
