// Requirements
let Extractor = require( './Extractor.js' );

/**
 * Extracts the vendor id from the extracted_data JSON-Object
 * Note:
 * - vendor_iban, vendor_vat_number should be extracted first
 *   (see iterateMatchesCleanup)
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
        for ( let i = 0; i < this.extracted_data.vendor_iban.length; i++ ) {
            let ibanValue = this.extracted_data.vendor_iban[ i ].value;
            let res = this.suppliers_loader.getSupplierForIban( ibanValue );
            if ( res.posting_block == true ) {
                continue;
            }
            if ( res != 0 ) {
                // add vendor_id to extracted_data
                let vendor_id = [ {
                    match: this.extracted_data.vendor_iban[ i ].match,
                    value: res.id,
                    position: 0
                } ];
                return vendor_id;
            }
        }

        // find supplier for vendor_vat_number
        for ( let i = 0; i < this.extracted_data.vendor_vat_number.length; i++ ) {
            let vat_number = this.extracted_data.vendor_vat_number[ i ].value;
            let res = this.suppliers_loader.getSupplierForVatNumber( vat_number );
            if ( res.posting_block == true ) {
                continue;
            }
            if ( res != 0 ) {
                let vendor_id = [ {
                    match: this.extracted_data.vendor_vat_number[ i ].match,
                    value: res.id,
                    position: 0
                } ];
                return vendor_id;
            }
        }

        let vendor_id = [ {
            match: '',
            value: '',
            position: 0
        } ];
        return vendor_id;
    }
}

module.exports = ExtractorVendorId;
