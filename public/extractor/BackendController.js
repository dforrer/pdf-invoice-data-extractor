// Requirements
const fs = require( 'fs' );
const js2xmlparser = require( "js2xmlparser" );
// Local requirements
const settings = require( './../../config/settings.json' );
const PdfExtractJob = require( './PdfExtractJob.js' );
const SuppliersLoader = require( './SuppliersLoader.js' );
const Queue = require( './Queue.js' );

/**
 * The BackendController class handles:
 * - Loading of the suppliers list (suppliers_loader)
 * - Sets up the communication with the frontend (ipcMain)
 * - Receives PDFs from the frontend, extracts the field values and
 *   sends them back to the frontend (pdf_queue)
 * @class
 */
class BackendController {

    constructor( ipcMain ) {
        this.ipcMain = ipcMain;
        this.running_jobs_count = 0;
        this.pdf_queue = new Queue();
        this.suppliers_loader = new SuppliersLoader();
        this.suppliers_loader.loadFromCsv( settings[ 'suppliers_csv_path' ], function() {
            console.log( 'loadSuppliers finished' );
        } );
    }

    //====================
    // Public methods
    //====================

    registerIpcEvents() {
        this.ipcMain.on( 'extract-data-from-pdf', ( event, arg ) => {
            //console.log( event );
            this.pdf_queue.append( {
                "event": event,
                "pdf": arg
            } );
            this.scheduleExtractJob();
        } );
        this.ipcMain.on( 'export-pdf-data', ( event, arg ) => {
            let formattedData = undefined;
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
        if ( this.pdf_queue.size() == 0 || this.running_jobs_count > 1 ) {
            return;
        }
        this.running_jobs_count += 1;
        let next = this.pdf_queue.removeAtIndex();
        let pdfExtractJob = new PdfExtractJob( next.pdf.filepath, this.suppliers_loader );
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
