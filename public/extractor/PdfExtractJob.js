// Requirements
const PDFExtract = require( 'pdf.js-extract' ).PDFExtract;
const pdfExtract = new PDFExtract();
// Local requirements
const settings = require( './../../settings.json' );
const sidebar_config = require( settings.sidebar_config );

/**
 *
 * @class
 */
class PdfExtractJob {
    /**
     * @constructor
     */
    constructor( filepath, suppliers_loader ) {
        this.filepath = filepath;
        this.suppliers_loader = suppliers_loader;
    }

    //====================
    // Public methods
    //====================

    async startJob() {
        const options = {};
        let pdf_content_json = await pdfExtract.extract( this.filepath, options );
        let pdf_text = this.parseJSON( pdf_content_json );
        let extracted_data = {};
        for ( let i = 0; i < sidebar_config.extractor_container_fields.length; i++ ) {
            let f = sidebar_config.extractor_container_fields[ i ];
            try {
                let ExtractorClass = require( './' + f.extractor_class + '.js' );
                let extractorClass = new ExtractorClass( pdf_text, extracted_data, this.suppliers_loader );
                extracted_data[ f.field_id ] = extractorClass.extract();
            } catch ( e ) {
                extracted_data[ f.field_id ] = [];
            }
        }
        return extracted_data;
    }

    // Helper function
    parseJSON( data ) {
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
            content = this.sortContent( content );
            for ( let i = 0; i < content.length; i++ ) {
                if ( i == 0 ) {
                    rv += pages[ 0 ].content[ 0 ].str;
                    continue;
                }
                rv = this.appendText( rv, content[ i - 1 ], content[ i ] );
            }
        }
        // replace dotless ı with i
        rv = rv.replace( /ı/g, 'i' );
        // ignore lines with a length smaller than 2
        rv = this.cleanup( rv );
        return rv;
    }

    // Helper function
    sortContent( c ) {
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
    appendText( text, prevEl, newEl ) {
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
    cleanup( text ) {
        let rv = '';
        let lines = text.split( '\n' );
        for ( let i = 0; i < lines.length; i++ ) {
            let line = lines[ i ].trim();
            line = line.replace( /\s{2,}/g, ' ' );
            rv += line + '\n';
        }
        return rv;
    }
}

module.exports = PdfExtractJob;
