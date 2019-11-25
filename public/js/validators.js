const util = require('./util.js');

function validate_rechnungsart ( str ) {
    var rv = { input: str, valid: true, default: false };
    if ( 'R' === str.toUpperCase() || /rechnung|rg|invoice|faktur|factur/gi.test( str ) ) {
        rv.output = 'R';
    } else if ('G' === str.toUpperCase() || /gutschrift|credit note|credit|crédit/gi.test( str ) ) {
        rv.output = 'G';
    } else {
        // default value
        rv.output = 'R';
        rv.default = true;
    }
    return rv;
}

function validate_rg_nummer ( str ) {
    var rv = { input: str, valid: true, default: false };
    // replace all whitespace characters
    rv.output = str.replace(/\s/g, '');
    return rv;
}

function validate_rg_datum ( str ) {
    var rv = { input: str, valid: true, default: false };
    var whitelist = '1234567890\./\\- ';
    var flags = 'gm';
    str = str.trim(); // remove leading and trailing spaces
    var str2 = util.removeChars( whitelist, str, flags );
    if ( /\b\d?\d(\.|\/| |-)\d?\d(\.|\/| |-)(\d\d)?\d\d\b/gi.test( str2 ) ) {
        var dmy = str2.split( /[\.|\/| |-]+/ );
        var dd   = dmy[0].padStart(2, '0');
        var mm   = dmy[1].padStart(2, '0');
        var yyyy = dmy[2];
        if ( yyyy.length === 2 ) {
            yyyy = '20' + yyyy;
        }
        rv.output = dd + '.' + mm  + '.' + yyyy;
    } else if ( str.length === 8 && /\b\d\d\d\d\d\d\d\d\b/gi.test( str ) ) {
        var dd   = str.substring( 0, 2 );
        var mm   = str.substring( 2, 4 );
        var yyyy = str.substring( 4 );
        rv.output = dd + '.' + mm  + '.' + yyyy;
    } else if ( str.length === 6 && /\b\d\d\d\d\d\d\b/gi.test( str ) ) {
        var dd   = str.substring( 0, 2 );
        var mm   = str.substring( 2, 4 );
        var yy = str.substring( 4 );
        rv.output = dd + '.' + mm  + '.' + '20' + yy;
    // } else if ( /20\d\d/gi.test( str ) ) {
    //     // string contains date format yyyy
    //     // find the year with a regex
    //     var regexp = /20\d\d/gi;
    //     var matches_array = str.match( regexp );
    //     var yyyy = matches_array[ 0 ];
    //     // remove the year
    //     str = str.replace(/20\d\d/g, '');
    //     // find the month in word form
    //     var mm = '01';
    //     if ( /januar|jan|january|janvier/gi.test( str ) ) {
    //         mm = '01';
    //     } else if ( /februar|febr?|february|février/gi.test( str ) ) {
    //         mm = '02';
    //     } else if ( /märz|mär|mar|marz|march|mars/gi.test( str ) ) {
    //         mm = '03';
    //     } else if ( /april|apr|avril/gi.test( str ) ) {
    //         mm = '04';
    //     } else if ( /mai|may/gi.test( str ) ) {
    //         mm = '05';
    //     } else if ( /juni|jun|june|juin/gi.test( str ) ) {
    //         mm = '06';
    //     } else if ( /juli|jul|july|juillet/gi.test( str ) ) {
    //         mm = '07';
    //     } else if ( /august|aug|aout|août/gi.test( str ) ) {
    //         mm = '08';
    //     } else if ( /september|sep|sept|septembre/gi.test( str ) ) {
    //         mm = '09';
    //     } else if ( /oktober|okt|october|octobre/gi.test( str ) ) {
    //         mm = '10';
    //     } else if ( /november|nov|novembre/gi.test( str ) ) {
    //         mm = '11';
    //     } else if ( /dezember|dez|december|décembre|decembre/gi.test( str ) ) {
    //         mm = '12';
    //     }
    //     // remove all non-digits
    //     var whitelist = '1234567890';
    //     var flags = 'gm';
    //     var dd = util.removeChars( whitelist, str, flags );
    //     dd = dd.padStart(2, '0');
    //     if (parseInt(dd) > 31 ) {
    //         dd = '01';
    //     }
    //     rv.output = dd + '.' + mm  + '.' + yyyy;
    } else {
        rv.output = rv.input;
        rv.valid = false;
    }
    return rv;
}

function validate_waehrung ( str ) {
    var rv = { input: str, valid: true, default: false };
    str = str.replace(/ /gm, '');
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

function validate_endbetrag ( str ) {
    var rv = { input: str, valid: true, default: false };
    // remove whitespace from front and end and split
    outputSplit = str.trim().split('');
    if ( outputSplit[ outputSplit.length - 2 ] == ' ' ) {
        outputSplit.splice( outputSplit.length - 2);
    }
    str = outputSplit.join('');
    // replace all non-digits (commas, dots, upticks) with dots
    str = str.replace(/\D/g, '.');
    // replace all but the last dot with nothing
    var f = parseFloat( str.replace(/\.(?![^.]+$)|[^0-9.]/g, ''));
    // check if f is NaN and not undefined
    if ( f === NaN || !f ) {
        rv.output = rv.input;
        rv.valid = false;
    } else {
        rv.output = f.toFixed(2);
    }
    return rv;
}

function validate_esr_konto ( str ) {
    var rv = { input: str, valid: true, default: false };
    var whitelist = '1234567890-';
    var flags = 'gm';
    rv.output = util.removeChars( whitelist, str, flags );
    return rv;
}

function validate_esr_referenz ( str ) {
    var rv = { input: str, valid: true, default: false };
    var whitelist = '1234567890';
    var flags = 'gm';
    rv.output = util.removeChars( whitelist, str, flags );
    return rv;
}

module.exports = {
    validate_rechnungsart,
    validate_rg_nummer,
    validate_rg_datum,
    validate_waehrung,
    validate_endbetrag,
    validate_esr_konto,
    validate_esr_referenz
}
