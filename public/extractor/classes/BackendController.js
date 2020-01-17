// Requirements
const PDFExtract = require( 'pdf.js-extract' ).PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require( 'fs' );
const js2xmlparser = require( "js2xmlparser" );
// Local requirements
const settings = require( './../../../settings.json' );
const PdfExtractJob = require( './PdfExtractJob.js' );

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
            this.scheduleExtractJob();
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
     * Async function
     */
    async scheduleExtractJob() {
        if ( this.size() == 0 || this.running_jobs_count > 1 ) {
            return;
        }
        this.running_jobs_count += 1;
        var next = this.last();
        this.remove();
        let pdfExtractJob = new PdfExtractJob( next.pdf.filepath );
        let extracted_data = {};
        try {
            extracted_data = await pdfExtractJob.startJob();
        } catch ( err ) {
            console.log( err );
        }
        next.pdf.extracted_data = extracted_data;
        next.event.reply( 'data-extraction-done', next.pdf );
        this.running_jobs_count -= 1;
        this.scheduleExtractJob();
    }
}

module.exports = BackendController;
