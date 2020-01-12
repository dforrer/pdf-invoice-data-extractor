// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor id from the extracted_data JSON-Object
 * Note:
 * - vendor_iban, vendor_vat_number should be extracted first
 *   (see iterate_matches_cleanup)
 * @class
 */
class ExtractorVendorId extends Extractor {
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
                // add vendor_id to extracted_data
                var vendor_id = [ {
                    match: this.extracted_data.vendor_iban[ i ].match,
                    value: res.id,
                    position: 0
                } ];
                return vendor_id;
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
                var vendor_id = [ {
                    match: this.extracted_data.vendor_vat_number[ i ].match,
                    value: res.id,
                    position: 0
                } ];
                return vendor_id;
            }
        }

        var vendor_id = [ {
            match: '',
            value: '',
            position: 0
        } ];
        return vendor_id;
    }
}

module.exports = ExtractorVendorId;
