// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the invoice amount due from the pdf text
 * Note:
 * - invoice_esr_amount should be extracted first
 *   (see iterate_matches_cleanup)
 * @class
 */
class ExtractorInvoiceAmountDue extends Extractor {
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
        var pattern = /(?:rechnungstotal|gesamtsumme|summe|amount|gesamtbetrag|total|invoicetotal|betrag|chf|sfr|fr\.|eur|usd|gbp|\$|€|brutto)(?:\s|\D){1,20}((?:\d{1,3}(?:\'|\’|\.|\,|\s)?)?(?:\d{1,3}(?:(?:\'|\.|\,|\ )?(?:\d{2}|-)?)))(?!%|\d)/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup( key, value ) {
        var r = {};
        // check if key contains keywords like datum, date, ...
        if ( /exk|innert (10|14|15|20|30)|liefer|zwischensumme/gi.test( key ) ) {
            return null;
        }
        r.match = value.g1;
        r.position = value.i;
        // remove all whitespace
        r.value = value.g1.trim();
        // replace all non-digits (commas, dots, upticks) with dots
        r.value = r.value.replace( /\D/g, '.' );
        // replace all but the last dot with nothing
        r.value = parseFloat( r.value.replace( /\.(?![^.]+$)|[^0-9.]/g, '' ) );
        if ( r.value == 0.0 ) {
            return null;
        }
        r.value = r.value.toFixed( 2 );
        return r;
    }

    /**
     * @param {Object} obj
     * @returns {Array} arr
     * @private
     */
    iterate_matches_cleanup( obj ) {
        var arr = super.iterate_matches_cleanup( obj );
        // sort by highest value descending
        arr = arr.sort( function( a, b ) {
            return parseFloat( b.value ) - parseFloat( a.value );
        } );
        // if invoice_esr_amount is set, replace the invoice_amount_due
        if ( this.extracted_data.invoice_esr_amount && this.extracted_data.invoice_esr_amount.length > 0 ) {
            arr = [];
            // e.g. 0100005310005
            // cut off first 2 and last character of esr_amount
            var esr_amount = this.extracted_data.invoice_esr_amount[ 0 ];
            var esr_amount_float = parseFloat( esr_amount.value.substring( 2, 12 ) ) / 100;
            arr.push( {
                match: esr_amount.match,
                position: esr_amount.position,
                value: esr_amount_float.toFixed( 2 )
            } );
        }
        return arr;
    }
}

module.exports = ExtractorInvoiceAmountDue;
