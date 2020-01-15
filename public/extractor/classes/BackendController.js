// Requirements
const PDFExtract = require( 'pdf.js-extract' ).PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require( 'fs' );
const js2xmlparser = require( "js2xmlparser" );
// Local requirements
const settings = require( './../../../settings.json' );
const parser = require( './../../../parser.js' );

/**
 *
 * @class
 */
class BackendController {

    constructor( ipcMain ) {
        this.ipcMain = ipcMain;
        this.running_jobs_count = 0;
        this.pdf_queue = [];
    }

    //====================
    // Public methods
    //====================

    /*
     * @param {Object} pdf_document
     * e.g. { "event":event, "pdf":arg }
     */
    add( pdf_document ) {
        this.pdf_queue.unshift( pdf_document );
    }

    remove() {
        this.pdf_queue.pop();
    }

    last() {
        return this.pdf_queue[ this.pdf_queue.length - 1 ];
    }

    size() {
        return this.pdf_queue.length;
    }

    /*
     *
     */
    registerIpcEvents() {

        this.ipcMain.on( 'extract-data-from-pdf', ( event, arg ) => {
            //console.log( event );
            this.add( {
                "event": event,
                "pdf": arg
            } );
            this.schedule_extract_job();
        } );

        this.ipcMain.on( 'export-pdf-data', ( event, arg ) => {
            var formattedData = undefined;
            if ( settings[ 'export_format' ] === 'json' ) {
                formattedData = JSON.stringify( arg.validated_data );
            } else {
                // default to XML format
                formattedData = js2xmlparser.parse( "invoice", arg.validated_data );
            }
            fs.writeFile( arg.filepath + '.' + settings[ 'export_format' ], formattedData, 'utf8', ( err ) => {
                if ( err ) throw err;
            } );
        } );
    }

    /*
     *
     */
    schedule_extract_job() {
        if ( this.size() == 0 || this.running_jobs_count > 1 ) {
            return;
        }
        this.running_jobs_count += 1;
        var nextEl = this.last();
        this.remove();
        this.extract_pdf( nextEl );
    }

    /*
     *
     */
    extract_pdf( nextEl ) {
        var self = this;
        const options = {};
        pdfExtract.extract( nextEl.pdf.filepath, options, ( err, data ) => {
            if ( err ) return console.log( err );
            if ( settings[ 'debug' ] ) {
                // write file to disk
                fs.writeFile( nextEl.pdf.filepath + '_DEBUG.json', JSON.stringify( data ), 'utf8', ( err ) => {
                    if ( err ) throw err;
                } );
            }
            parser.parseJsonAndExport( data,
                function( pdf_text, extracted_data ) {
                    nextEl.pdf.extracted_data = extracted_data;
                    nextEl.event.reply( 'data-extraction-done', nextEl.pdf );
                    self.running_jobs_count -= 1;
                    self.schedule_extract_job();
                    if ( settings[ 'debug' ] ) {
                        // write file to disk
                        fs.writeFile( nextEl.pdf.filepath + '_DEBUG.txt', pdf_text, 'utf8', ( err ) => {
                            if ( err ) throw err;
                        } );
                    }
                }
            );
        } );
    }
}

module.exports = BackendController;
