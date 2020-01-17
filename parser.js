// Requirements
const settings = require( './settings.json' )
const suppliers_loader = require( './public/extractor/suppliers_loader.js' );
suppliers_loader.loadSuppliers( settings[ 'suppliers_csv_path' ], function() {
    console.log( 'loadSuppliers finished' );
} );
const sidebar_config = require( settings.sidebar_config );

// Main function
function parseJsonAndExport( data ) {
    let pdf_text = parseJSON( data );
    let extracted_data = {};
    for ( let i = 0; i < sidebar_config.extractor_container_fields.length; i++ ) {
        let f = sidebar_config.extractor_container_fields[ i ];
        try {
            let ExtractorClass = require( './public/extractor/classes/' + f.extractor_class + '.js' );
            let extractorClass = new ExtractorClass( pdf_text, extracted_data, suppliers_loader );
            extracted_data[ f.field ] = extractorClass.extract();
        } catch ( e ) {
            extracted_data[ f.field ] = [];
        }
    }
    return {
        pdf_text: pdf_text,
        extracted_data: extracted_data
    };
}

// Helper function
function parseJSON( data ) {
    let rv = '';
    let pages;
    try {
        pages = data.pages;
    } catch ( err ) {
        console.log( 'ERROR: Input file could not be parsed. Could not parse pages.' );
        return rv;
    }
    for ( let p = 0; p < pages.length; p++ ) {
        rv += '\n---------- ' + ( p + 1 ) + ' ----------\n'
        let content = pages[ p ].content;
        content = sortContent( content );
        for ( let i = 0; i < content.length; i++ ) {
            if ( i == 0 ) {
                rv += pages[ 0 ].content[ 0 ].str;
                continue;
            }
            rv = appendText( rv, content[ i - 1 ], content[ i ] );
        }
    }
    // replace dotless ı with i
    rv = rv.replace( /ı/g, 'i' );
    // ignore lines with a length smaller than 2
    rv = cleanup( rv );
    return rv;
}

// Helper function
function sortContent( c ) {
    c.sort( function( a, b ) {
        // same line
        if ( Math.abs( ( a.y + a.height / 2 ) - ( b.y + b.height / 2 ) ) < 5.0 ) {
            return a.x - b.x;
        } else {
            return a.y - b.y;
        }
    } );
    return c;
}

// Helper function
function appendText( text, prevEl, newEl ) {
    if ( Math.abs( ( prevEl.y + prevEl.height / 2 ) - ( newEl.y + newEl.height / 2 ) ) < 5.0 ) {
        if ( Math.abs( prevEl.x + prevEl.width - newEl.x ) > 0.5 ) {
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
    let rv = '';
    let lines = text.split( '\n' );
    for ( let i = 0; i < lines.length; i++ ) {
        let line = lines[ i ].trim();
        line = line.replace( /\s{2,}/g, ' ' );
        rv += line + '\n';
    }
    return rv;
}

// Node.js module exports
module.exports = {
    parseJsonAndExport
}
