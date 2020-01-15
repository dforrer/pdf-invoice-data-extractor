// Requirements
const settings = require('./settings.json')
const suppliers_loader = require('./public/extractor/suppliers_loader.js');
suppliers_loader.loadSuppliers(settings['suppliers_csv_path'], function () {
    console.log('loadSuppliers finished');
});
const sidebar_config = require( settings.sidebar_config );

// Main function
function parseJsonAndExport ( data, cb ) {
    var pdf_text = parseJSON( data );
    var extracted_data = {};
    for ( var i = 0; i < sidebar_config.extractor_container_fields.length; i++ ) {
        var f = sidebar_config.extractor_container_fields[ i ];
        try {
            var ExtractorClass = require( './public/extractor/classes/' + f.extractor_class + '.js' );
            var extractorClass = new ExtractorClass( pdf_text, extracted_data, suppliers_loader );
            extracted_data[ f.field ] = extractorClass.extract();
        } catch ( e ) {
            extracted_data[ f.field ] = [];
        }
    }
    cb( pdf_text, extracted_data );
}

// Helper function
function parseJSON( data ) {
    var out = '';
    try {
        var pages = data.pages;
    } catch ( err ) {
        console.log('ERROR: Input file could not be parsed. Could not parse pages.');
        return out;
    }
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
function sortContent( c ) {
    c.sort( function ( a, b ) {
        // same line
        if ( Math.abs((a.y + a.height/2) - (b.y + b.height/2)) < 5.0 ) {
            return a.x - b.x;
        } else {
            return a.y - b.y;
        }
    });
    return c;
}

// Helper function
function appendText( text, prevEl, newEl ) {
    if ( Math.abs((prevEl.y + prevEl.height/2) - (newEl.y + newEl.height/2)) < 5.0 ) {
        if ( Math.abs( prevEl.x + prevEl.width - newEl.x) > 0.5 ) {
            text += ' ' + newEl.str;
        } else {
            text += newEl.str;
        }
    } else {
        text += '\n';
        text += newEl.str;
    }
    return text;
}

// Helper function
function cleanup( text ) {
    var out = "";
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var lineVal    = lines[i].trim();
        lineVal = lineVal.replace(/\s{2,}/g, ' ');
        var lineLength = lineVal.length;
        //if ( lineLength > 2 ) {
            out += lineVal + '\n';
        //}
    }
    return out;
}

// Node.js module exports
module.exports = {
    parseJsonAndExport
}
