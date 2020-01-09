// Requirements
var Extractor = require( './Extractor.js' );

/**
 * Extracts the invoice date from the pdf text
 * @class
 */
class ExtractorInvoiceDate extends Extractor {
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
    extractRegex ( str ) {
        // datum_dirty_ddmmyy allows whitespace as separators between numbers
        var pattern = /\b(31)(?:\/|-|\.|\040)\D?((?:0?[13578]|1[02])|(?:januar|jan|january|janvier|März|mär|mar|Marz|march|mars|Mai|may|Juli|jul|july|juillet|august|aug|aout|août|oktober|okt|october|octobre|dezember|dez|december|décembre|decembre))(?:\/|-|\.|\040)((?:20)?\d{2})\b|\b(29|30)(?:\/|-|\.|\040)\D?((?:0?[1,3-9]|1[0-2])|(?:januar|jan|january|janvier|März|mär|mar|Marz|march|mars|April|apr|avril|Mai|may|Juni|jun|june|juin|Juli|jul|july|juillet|august|aug|aout|août|september|sep|sept|septembre|oktober|okt|october|octobre|november|nov|novembre|dezember|dez|december|décembre|decembre))(?:\/|-|\.|\040)\D?((?:20)?\d{2})\b|\b(29)(?:\/|-|\.|\040)\D?(0?2|(februar|febr?|february|février))\D?(?:\/|-|\.|\040)\D?((?:(?:20)?(?:0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00)))\b|\b(0?[1-9]|1\d|2[0-8])\D?(?:\/|-|\.|\040)\D?((?:0?[1-9])|(?:1[0-2])|(?:\ |\t)?(?:januar|jan|january|janvier|februar|febr?|february|février|März|mär|mar|Marz|march|mars|April|apr|avril|Mai|may|Juni|jun|june|juin|Juli|jul|july|juillet|august|aug|aout|août|september|sep|sept|septembre|oktober|okt|october|octobre|november|nov|novembre|dezember|dez|december|décembre|decembre))\D?(?:\/|-|\.|\040)\D?((?:20)?\d{2})\b/gim;
        return this.loopMatches( str, pattern );
    }

    /**
     * @param {Object} key
     * @param {Object} value
     * @returns {Object} r
     */
    cleanup ( key, value ) {
        var r = {};
        r.match = key;
        var dd = value.g1.padStart(2, '0');
        var mm = '01'; // default value
        var g2 = value.g2;

        if ( /januar|jan|january|janvier|\b1\b|01/gi.test(g2) ) {
            mm = '01';
        } else if ( /februar|febr?|february|février|\b2\b|02/gi.test(g2) ) {
            mm = '02';
        } else if ( /märz|mär|mar|marz|march|mars|3|03/gi.test(g2) ) {
            mm = '03';
        } else if ( /april|apr|avril|4|04/gi.test(g2) ) {
            mm = '04';
        } else if ( /mai|may|5|05/gi.test(g2) ) {
            mm = '05';
        } else if ( /juni|jun|june|juin|6|06/gi.test(g2) ) {
            mm = '06';
        } else if ( /juli|jul|july|juillet|7|07/gi.test(g2) ) {
            mm = '07';
        } else if ( /august|aug|aout|août|8|08/gi.test(g2) ) {
            mm = '08';
        } else if ( /september|sep|sept|septembre|9|09/gi.test(g2) ) {
            mm = '09';
        } else if ( /oktober|okt|october|octobre|10/gi.test(g2) ) {
            mm = '10';
        } else if ( /november|nov|novembre|11/gi.test(g2) ) {
            mm = '11';
        } else if ( /dezember|dez|december|décembre|decembre|12/gi.test(g2) ) {
            mm = '12';
        }
        var yyyy = '';
        if ( value.g3.length == 2 ) {
            yyyy = '20' + value.g3
        } else {
            yyyy = value.g3;
        }
        r.value = dd + '.' + mm  + '.' + yyyy;
        r.position = value.i;
        var inv_date = new Date(yyyy + '-' + mm + '-' + dd);
        var today_date = new Date();
        var days_between = (today_date - inv_date)/(1000*60*60*24);
        if ( days_between > ( 365*20 ) || days_between < ( -30*4 ) ) {
            return null;
        }
        return r;
    }
}

module.exports = ExtractorInvoiceDate;
