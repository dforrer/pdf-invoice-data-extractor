// get filename of current script
var path = require('path');
var scriptName = path.basename(__filename);

// handle script differently based on how it is being called
if (require.main === module) {
    console.log(scriptName + ' called directly');
    // parse cmd-line arguments
    var inputfile = process.argv[2];
    var outputfile = process.argv[3];

    if ( !inputfile || !outputfile ) {
        console.log("Please define an input- and output-file!");
        process.exit(1);
    }

    parseJsonAndExport( inputfile, outputfile, function (rv) {
        console.log(rv);
    });
} else {
    console.log(scriptName + ' required as a module');
}

// Requirements
const fs   = require('fs');
const util = require('util');

// Main function
function parseJsonAndExport ( data, cb ) {
    var out = parseJSON( data );
    var extracted_data = extractRegex( out );

    extracted_data = cleanup_extracted_data(extracted_data);
    extracted_data = keepTopFive(extracted_data);

    cb( extracted_data );
}

function keepTopFive (data) {
    for (const p of Object.entries(data)) {
        var key   = p[0];
        var arr   = p[1];
        data[key] = arr.slice(0,5);
    }
    return data;
}

function cleanup_extracted_data ( d ) {
    // seiten cleanup ---------------------
    var arr = Object.values(d.seiten);
    arr.sort( function( a, b ) {
        return parseInt(a.g1) - parseInt(b.g1);
    });
    var seiten_rv = [];
    for ( var i = 0 ; i < arr.length ; i++ ) {
        seiten_rv.push(arr[i].i);
    }
    d.seiten = seiten_rv;

    // rg_datum cleanup -------------------
    //d.rg_datum = rg_datum_cleanup(d.rg_datum);

    // rg_datum_dirty cleanup -------------------
    d.rg_datum = rg_datum_cleanup(d.rg_datum_dirty);
    delete d.rg_datum_dirty;

    // endbetrag cleanup ------------------
    var endbetrag_rv = [];
    for (const p of Object.entries(d.endbetrag)) {
        var key   = p[0];
        // check if key contains keywords like datum, date, ...
        if ( /exk|innert (10|14|15|20|30)|zwischensumme/gi.test(key) ) {
            continue;
        }
        var value = p[1];
        var r = {};
        r.match = value.g1;
        r.position = value.i;
        // remove all whitespace
        r.value = value.g1.trim();
        // replace all non-digits (commas, dots, upticks) with dots
        r.value = r.value.replace(/\D/g, '.');
        // replace all but the last dot with nothing
        r.value = parseFloat(r.value.replace(/\.(?![^.]+$)|[^0-9.]/g, ''));
        if ( r.value == 0.0 ) {
            continue;
        }
        endbetrag_rv.push( r );
    }
    d.endbetrag = endbetrag_rv;

    // waehrung cleanup ---------------
    var waehrung_rv = [];
    for (const p of Object.entries(d.waehrung)) {
        var key   = p[0];
        var value = p[1];
        var r = {};
        r.match = key;
        r.value = value.g1;
        r.position = value.i;
        waehrung_rv.push( r );
    }
    d.waehrung = waehrung_rv;

    // email cleanup ---------------
    var email_rv = [];
    for (const p of Object.entries(d.email)) {
        var key   = p[0];
        var value = p[1];
        var r = {};
        r.match = key;
        r.value = value.g1;
        r.position = value.i;
        email_rv.push( r );
    }
    d.email = email_rv;

    // rg_nummer cleanup ------------------
    var rg_nummer_rv = [];
    for (const p of Object.entries(d.rg_nummer)) {
        var key   = p[0];
        // check if key contains keywords like datum, date, ...
        if ( /datum|date|betrag|per.|konto|amount|ean|total|periode|kunde/gi.test(key) ) {
            continue;
        }
        var value = p[1];
        var r = {};
        r.match = value.g1;
        r.value = value.g1.replace(/\s/gi,'');
        r.position = value.i;
        rg_nummer_rv.push( r );
    }
    d.rg_nummer = rg_nummer_rv;

    // mwst cleanup ---------------
    var mwst_rv = [];
    for (const p of Object.entries(d.mwst)) {
        var key   = p[0];
        var value = p[1];
        var r = {};
        r.match = key;
        r.value = value.g1.replace(/-/gi,'')
                          .replace(/\./gi,'')
                          .replace(/\s/gi,'');
        r.position = value.i;
        mwst_rv.push( r );
    }
    d.mwst = mwst_rv;

    // iban cleanup ---------------
    var iban_rv = [];
    for (const p of Object.entries(d.iban)) {
        var key   = p[0];
        var value = p[1];
        var r = {};
        r.match = key;
        r.value = value.g1.replace(/\s/gi,'');
        r.position = value.i;
        iban_rv.push( r );
    }
    d.iban = iban_rv;

    // rechnungsart cleanup ---------------
    var rechnungsart_rv = [];
    for (const p of Object.entries(d.rechnungsart)) {
        var r = {};
        var key   = p[0];
        var value = p[1];
        switch ( value.g1 ) {
            case "G":
            case "g":
            case "C":
            case "c":
                r.value = "G";
                break;
            case "R":
            case "I":
            case "r":
            case "i":
            default:
                r.value = "R";
                break;
        }
        r.match = key;
        r.position = value.i;
        rechnungsart_rv.push( r );
    }
    d.rechnungsart = rechnungsart_rv;

    // esr_mit_betrag cleanup ---------------
    var esr_betrag_rv   = [];
    var esr_referenz_rv = [];
    var esr_konto_rv    = [];

    for (const p of Object.entries(d.esr_mit_betrag)) {
        // clear esr_ohne_betrag if we have an entry in esr_mit_betrag
        d.esr_ohne_betrag = {};
        // setup variables
        var key         = p[0];
        var value       = p[1];
        var r_betrag    = {};
        var r_referenz  = {};
        var r_konto     = {};
        // betrag
        r_betrag.match      = value.g1;
        r_betrag.value      = value.g1;
        r_betrag.position   = value.i;
        esr_betrag_rv.push( r_betrag );
        // referenz
        r_referenz.match    = value.g2;
        r_referenz.value    = value.g2;
        r_referenz.position = value.i;
        esr_referenz_rv.push( r_referenz );
        // konto
        r_konto.match       = value.g3;
        r_konto.value       = value.g3;
        r_konto.position    = value.i;
        esr_konto_rv.push( r_konto );
    }
    d.esr_betrag    = esr_betrag_rv;
    d.esr_referenz  = esr_referenz_rv;
    d.esr_konto     = esr_konto_rv;

    // esr_ohne_betrag cleanup ---------------
    if ( Object.entries(d.esr_ohne_betrag) != 0 ) {
        var esr_ohne_referenz_rv = [];
        var esr_ohne_konto_rv    = [];

        for (const p of Object.entries(d.esr_ohne_betrag)) {
            // setup variables
            var key         = p[0];
            var value       = p[1];
            var r_referenz  = {};
            var r_konto     = {};
            // referenz
            r_referenz.match    = value.g2;
            r_referenz.value    = value.g2;
            r_referenz.position = value.i;
            esr_ohne_referenz_rv.push( r_referenz );
            // konto
            r_konto.match       = value.g3;
            r_konto.value       = value.g3;
            r_konto.position    = value.i;
            esr_ohne_konto_rv.push( r_konto );
        }
        d.esr_referenz  = esr_ohne_referenz_rv;
        d.esr_konto     = esr_ohne_konto_rv;
    }

    // check if esr_betrag is not empty
    if ( d.esr_betrag.length > 0 ) {
        // e.g. 0100005310005
        // cut off first 2 and last character of esr_betrag
        var esr_betrag = parseFloat( d.esr_betrag[0].value.substring(2, 12) )/100;
        d.endbetrag = [];
        d.endbetrag.push( { match: d.esr_betrag[0].match, position:d.esr_betrag[0].position, value:esr_betrag } );
    }

    // delete elements
    delete d.esr_ohne_betrag;
    delete d.esr_mit_betrag;

    return d;
}

function rg_datum_cleanup ( rg_datum ) {
    var rg_datum_rv = [];

    for (const p of Object.entries(rg_datum)) {
        var key   = p[0];
        var value = p[1];
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
        var rg_datum_date = new Date(yyyy + '-' + mm + '-' + dd);
        var today_date = new Date();
        var days_between = (today_date - rg_datum_date)/(1000*60*60*24);
        if ( days_between > ( 365*20 ) || days_between < ( -30*4 ) ) {
            continue;
        }

        rg_datum_rv.push( r );
    }
    return rg_datum_rv;
}

function extractRegex( str ) {
    var pattern_seiten = /---------- (\d{1,5}) ----------/gim;
    var pattern_rechnungsart = /(?:\b(?:Ausgangs)?(R)(?:echnung\b))|(?:\b(R)(?:g\.\b))|(?:\b(R)g\b)|(?:\b(I)nvoice\b)|(?:\bFaktu(r)a\b)|(?:\bFactu(r)e\b)|(?:\b(G)utschrift\b)|(?:\b(C)redit note\b)|(?:\b(c)rédit\b)/gim;
    var pattern_mwst = /((?:(?:CHE)(?:-|\s)?)\d{3}(?:\.|\s)?\d{3}(?:\.|\s)?\d{3})(?: |\t)?/gim;
    var pattern_waehrung = /(\bCHF\b)|(\bEUR\b)|(\bUSD\b)|(\bGBP\b)/gim;
    var pattern_iban = /\b((?:CH|HR|LI|LV) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4}(?:[ ]?[a-zA-Z0-9]{1}))|((?:BG|BH|CR|DE|GB|GE|IE|ME|RS|VA) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4}(?:[ ]?[a-zA-Z0-9]{2}))|((?:NO) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){2}(?:[ ]?[a-zA-Z0-9]{3}))|((?:BE|BI) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){3})|((?:DK|FI|FO|GL|NL) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){3}(?:[ ]?[a-zA-Z0-9]{2}))|((?:MK|SI) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){3}(?:[ ]?[a-zA-Z0-9]{3}))|((?:AT|BA|EE|KZ|LT|LU|XK) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4})|((?:AE|GI|IL|IQ|TL) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){4}(?:[ ]?[a-zA-Z0-9]{3}))|((?:AD|CZ|DZ|ES|MD|PK|RO|SA|SE|SK|TN|VG) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5})|((?:AO|CV|MZ|PT|ST) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5}(?:[ ]?[a-zA-Z0-9]{1}))|((?:IR|IS|TR) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5}(?:[ ]?[a-zA-Z0-9]{2}))|((?:BF|CF|CG|CM|EG|FR|GA|GR|IT|MC|MG|MR|SM) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){5}(?:[ ]?[a-zA-Z0-9]{3}))|((?:AL|AZ|BJ|BY|CI|CY|DO|GT|HU|LB|ML|PL|SN|SV) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6})|((?:BR|PS|QA|UA) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6}(?:[ ]?[a-zA-Z0-9]{1}))|((?:JO|KW|MU) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6}(?:[ ]?[a-zA-Z0-9]{2}))|((?:MT|SC) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){6}(?:[ ]?[a-zA-Z0-9]{3}))|((?:LC) ?[0-9]{2}(?:[ ]?[a-zA-Z0-9]{4}){7})\b/gm;
    var pattern_esr_mit_betrag  = /(?:\s|\D|^)(\d{13})>(\d{5,27})\+\s{0,3}(\d{9})>/gim;
    var pattern_esr_ohne_betrag = /(?:\s|\D|^)(\d{3})>(\d{5,27})\+\s{0,3}(\d{9})>/gim;
    // datum_dirty_ddmmyy allows whitespace as separators between numbers
    var pattern_datum_dirty_ddmmyy = /\b(31)(?:\/|-|\.|\040)\D?((?:0?[13578]|1[02])|(?:januar|jan|january|janvier|März|mär|mar|Marz|march|mars|Mai|may|Juli|jul|july|juillet|august|aug|aout|août|oktober|okt|october|octobre|dezember|dez|december|décembre|decembre))(?:\/|-|\.|\040)((?:20)?\d{2})\b|\b(29|30)(?:\/|-|\.|\040)\D?((?:0?[1,3-9]|1[0-2])|(?:januar|jan|january|janvier|März|mär|mar|Marz|march|mars|April|apr|avril|Mai|may|Juni|jun|june|juin|Juli|jul|july|juillet|august|aug|aout|août|september|sep|sept|septembre|oktober|okt|october|octobre|november|nov|novembre|dezember|dez|december|décembre|decembre))(?:\/|-|\.|\040)\D?((?:20)?\d{2})\b|\b(29)(?:\/|-|\.|\040)\D?(0?2|(februar|febr?|february|février))\D?(?:\/|-|\.|\040)\D?((?:(?:20)?(?:0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00)))\b|\b(0?[1-9]|1\d|2[0-8])\D?(?:\/|-|\.|\040)\D?((?:0?[1-9])|(?:1[0-2])|(?:\ |\t)?(?:januar|jan|january|janvier|februar|febr?|february|février|März|mär|mar|Marz|march|mars|April|apr|avril|Mai|may|Juni|jun|june|juin|Juli|jul|july|juillet|august|aug|aout|août|september|sep|sept|septembre|oktober|okt|october|octobre|november|nov|novembre|dezember|dez|december|décembre|decembre))\D?(?:\/|-|\.|\040)\D?((?:20)?\d{2})\b/gim;
    var pattern_datum_ddmmyy = /\b(31)(?:\/|-|\.)\D?((?:0?[13578]|1[02])|(?:januar|jan|january|janvier|März|mär|mar|Marz|march|mars|Mai|may|Juli|jul|july|juillet|august|aug|aout|août|oktober|okt|october|octobre|dezember|dez|december|décembre|decembre))(?:\/|-|\.)((?:20)?\d{2})\b|\b(29|30)(?:\/|-|\.)\D?((?:0?[1,3-9]|1[0-2])|(?:januar|jan|january|janvier|März|mär|mar|Marz|march|mars|April|apr|avril|Mai|may|Juni|jun|june|juin|Juli|jul|july|juillet|august|aug|aout|août|september|sep|sept|septembre|oktober|okt|october|octobre|november|nov|novembre|dezember|dez|december|décembre|decembre))(?:\/|-|\.)\D?((?:20)?\d{2})\b|\b(29)(?:\/|-|\.)\D?(0?2|(februar|febr?|february|février))\D?(?:\/|-|\.)\D?((?:(?:20)?(?:0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00)))\b|\b(0?[1-9]|1\d|2[0-8])\D?(?:\/|-|\.)\D?((?:0?[1-9])|(?:1[0-2])|(?:\ |\t)?(?:januar|jan|january|janvier|februar|febr?|february|février|März|mär|mar|Marz|march|mars|April|apr|avril|Mai|may|Juni|jun|june|juin|Juli|jul|july|juillet|august|aug|aout|août|september|sep|sept|septembre|oktober|okt|october|octobre|november|nov|novembre|dezember|dez|december|décembre|decembre))\D?(?:\/|-|\.)\D?((?:20)?\d{2})\b/gim;
    var pattern_datum_mmddyy = /TODO/gim;
    var pattern_datum_yymmdd = /TODO/gim;
    var pattern_referenz = /TODO/gim;


    var pattern_email = /\b((?:(?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@(?:(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(?:(?:[a-zA-Z\-0-9]+(?:\.))+[a-zA-Z]{2,})))\b/gim;
    var pattern_endbetrag = /(?:(?:end|zwischen)summe|Rechnungstotal|Rechnungstotal|(?:Gesamt|Rechnung(?:s)?)?(?:total|summe|betrag)(?:\ +)?(?:Rechnung)?(?:in)?|Rechnungsbetrag|Total (?:Rechnung|amount))(?:\ +)?(?:30 Tage netto)?.+(?:(?:in)?(\ )(?:CHF|EUR|USD|GBP|(?:\D){1,4}))?\ ?\:?(?:\ +)?(?:\(?ink(?:\D)?(?:\.|\,)? MWST\.?\)?)?\ +?(?:CHF|EUR|USD|GBP|Fr.)?(?:\ +)?((?:\d{1,3}(?:\'|\’|\.|\,|\s)?)?(?:\d{1,3}(?:(?:\'|\.|\,|\ )\d{0,2})))/gim;
    var pattern_rechnungsnummer = /(?:(?:rechnung|Rechn|faktura|facture|invoice|Gutschrift|credit note)(?:\d|\D)?(?:\n)?(?:nummer|number|nr\.|Nr):?\s?(\d{2,16}))|(?:(?:Rechnung|Rechn|faktura|facture|invoice)(?:\D{1,16})?(\d+(?:\.|\'|-)?\d+))|(?:(?:Rechnung|faktura|facture|invoice|Gutschrift|credit note)(?:\D{1,16})?(?:\n)?(?:\D{1,6})?(?:\n)?(\d{2,16}))/gim;

    /*
     * Output of this function
    {
        seiten: {
            // key = pagenumber (1,2,3,...)
            // pos = position in text (0, 1220, 2249, ...)
        },
        rechnungsart: {
            // key = regex match (Rechnung, facture, credit note)
            // pos = position in text (121)
            // val = value of group1 (R,G)
        },
        mwst: {
            // key = regex match (CHE-108.384.621)
            // pos = position in text (121)
            // val = cleaned up match (CHE108384621)
        },
        waehrung: {
            // key = regex match (CHF,EUR,USD)
            // pos = position in text (121)
            // val = cleaned up match (CHF,EUR,USD)
        },
        iban: {
            // key = regex match (CH71 0630 0503 0363 3511 1)
            // pos = position in text (121)
            // val = cleaned up match (CH7106300503036335111)
        },
        rg_datum: {
            // key = regex match (14. januar 2019)
            // pos = position in text (121)
            // val = cleaned up match (14.01.2019)
        },
        esr_betrag: {
            // key = regex match (0100000521257)
            // pos = position in text (121)
            // val = cleaned up match (521.25)
        },
        esr_konto: {
            // key = regex match (010040733)
            // pos = position in text (121)
            // val = cleaned up match (01-004073-3)
        },
        email: {
            // key = regex match (info@capag.ch)
            // pos = position in text (121)
            // val = cleaned up match (info@capag.ch)
        },
        endbetrag: {
            // key = regex match (1.317,70)
            // pos = position in text (121)
            // val = cleaned up match (1317.70)
        },
        rg_nummer: {
            // key = regex match (19070204)
            // pos = position in text (121)
            // val = cleaned up match (19070204)
        },
    }
     */

     var patterns = {
         seiten: pattern_seiten,
         rechnungsart: pattern_rechnungsart,
         mwst: pattern_mwst,
         waehrung: pattern_waehrung,
         iban: pattern_iban,
         esr_mit_betrag: pattern_esr_mit_betrag,
         esr_ohne_betrag: pattern_esr_ohne_betrag,
         //rg_datum: pattern_datum_ddmmyy,
         rg_datum_dirty: pattern_datum_dirty_ddmmyy,
         email: pattern_email,
         endbetrag: pattern_endbetrag,
         rg_nummer: pattern_rechnungsnummer
     };

    var rv = {};
    for (const p of Object.entries(patterns)) {
        rv[p[0]] = loopMatches(str, p[1]);
    }
    return rv;
}

// Helper function
function loopMatches( str, pattern ) {
    var rv = {};
    while ((match = pattern.exec(str)) != null) {
        var entry = { i: match.index }; // index
        // remove undefined results from array
        match = match.filter(function (el) {
            return el != null;
        });

        entry.g1 = match[1]; // group 1
        match[2] != undefined ? entry.g2 = match[2]:1; // group 2
        match[3] != undefined ? entry.g3 = match[3]:1; // group 3
        var m = match[0].trim();
        if ( !rv[m] ) {
            // key doesn't exist yet
            rv[m] = entry;
        }
    }
    return rv;
}

// Helper function
function parseJSON( data ) {
    try {
        var pages = data.pages;
    } catch ( err ) {
        console.log('ERROR: Input file could not be parsed. Process exit.');
        process.exit(1);
    }
    var out = '';
    // iterate over all lists
    for ( var p = 0 ; p < pages.length ; p++ ) {
        out += '\n---------- ' + (p+1) + ' ----------\n'
        var content = pages[p].content;
        content = sortContent(content);
        for ( var i = 0 ; i < content.length; i++ ) {
            if ( i == 0 ) {
                out += pages[0].content[0].str;
                continue;
            }
            var prevEl = content[i-1];
            var thisEl = content[i];
            out = appendText(out, prevEl, thisEl);
        }
    }
    // replace dotless ı with i
    out = out.replace(/ı/g, 'i');
    // ignore lines with a length smaller than 2
    out = cleanup(out);

    return out;
}

// Helper function
function removeWhitespace( str ) {
    return str.replace(/\s+/g, '.');
}

// Helper function
function keepAlpha( str ) {
    return str.replace(/[\W_]+/gim, '');
}

// Helper function
function sortContent( c ) {
    c.sort( function ( a, b ) {
        // same line
        if ( Math.abs(a.y - b.y) < 0.1 ) {
            return a.x - b.x;
        } else {
            return a.y - b.y;
        }
    });
    return c;
}

// Helper function
function appendText( text, prevEl, newEl ) {
    if ( Math.abs( prevEl.y - newEl.y ) < 0.1 ) {
        if (Math.abs( prevEl.x + prevEl.width - newEl.x) > 0.5 ) {
            text += ' ' + newEl.str;
        } else {
            text += newEl.str;
        }
    } else {
        text += '\n' + newEl.str;
    }
    return text;
}

// Helper function
function cleanup( text ) {
    var out = "";
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var lineVal    = lines[i].trim();
        var lineLength = lineVal.length;
        if ( lineLength > 2 ) {
            out += lineVal + '\n';
        }
    }
    return out;
}

// Node.js module exports
module.exports = {
    parseJsonAndExport
}
