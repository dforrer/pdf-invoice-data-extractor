// Requirements
const {
    ipcRenderer
} = require( 'electron' );
// Local requirements
const settings = require( './../../config/settings.json' );

const SuppliersLoader = require( '../extractor/SuppliersLoader.js' );
const Sidebar = require( '../extractor/Sidebar.js' );
const SidebarField = require( '../extractor/SidebarField.js' );
const Queue = require( '../extractor/Queue.js' );

// GUI variables
let viewer = null; // div 'viewer' reference from PDFViewerApplication
let viewerSpans = []; // Array of all the span-elements inside the viewer div
let isMouseDown = false;
let mouseDownCache = ''; // string to store the content of the current selection
let previousTarget = null;
let focusedInput = null;

// Model object declarations
class Pdf {
    constructor( filepath, extracted_data ) {
        this.filepath = filepath;
        this.extracted_data = extracted_data;
    }
}

/**
 * The BackendController class handles:
 * - Loading of the suppliers list (suppliers_loader)
 * - handles the GUI index_frontend_controller.html
 * - Sends PDFs to the backend, receives the PDFs including the extracted data
 * @class
 */
class FrontendController {

    constructor() {
        this.pdf_queue = new Queue();
        this.pdf_loaded = false;
        this.settings = settings;
        this.suppliers_loader = new SuppliersLoader();
        this.suppliers_loader.loadFromCsv( settings[ 'suppliers_csv_path' ], function() {
            console.log( 'loadSuppliers finished' );
        } );
        this.sidebar = new Sidebar( this );
        this.sidebar.addFieldsFromConfig();
        this.sidebar.renderSidebarFields();
        this.sidebar.setButtonTitles();
        this.sidebar.registerLongPressHandler();
        FrontendController.waitForElement();
    }

    //====================
    // Public methods
    //====================

    registerKeyboardHandler() {
        // Register keyboard shortcuts
        const $this = this;
        window.addEventListener( 'keyup', function( e ) {
            if ( e.ctrlKey && e.key.toLowerCase() === "n" ) {
                $this.nextPdf();
            } else if ( e.ctrlKey && e.key.toLowerCase() === "b" ) {
                $this.previousPdf();
            }
        } );
    }

    static mousemoveHandler( e ) {
        if ( isMouseDown && e.target !== previousTarget ) {
            mouseDownCache += '' + e.target.innerText;
        }
        previousTarget = e.target;
    }

    static dblclickHandler( e ) {
        if ( e.target !== previousTarget ) {
            mouseDownCache += e.target.innerText;
        }
        previousTarget = e.target;
        if ( mouseDownCache.length > 0 ) {
            focusedInput.value = mouseDownCache;
            focusedInput.focus();
        }
    }

    static addSpanEventListener() {
        for ( let i = 0; i < viewerSpans.length; i++ ) {
            viewerSpans[ i ].addEventListener( 'mousemove', FrontendController.mousemoveHandler );
            viewerSpans[ i ].addEventListener( 'dblclick', FrontendController.dblclickHandler );
        }
    }

    static removeSpanEventListener() {
        for ( let i = 0; i < viewerSpans.length; i++ ) {
            viewerSpans[ i ].removeEventListener( 'mousemove', FrontendController.mousemoveHandler );
            viewerSpans[ i ].removeEventListener( 'dblclick', FrontendController.dblclickHandler );
        }
    }

    static registerSpanOnMouseOver() {
        FrontendController.removeSpanEventListener();
        viewerSpans = Array.from( viewer.getElementsByTagName( 'span' ) );
        FrontendController.addSpanEventListener();
    }

    static waitForElement() {
        console.log( "Waiting for element" );
        try {
            // try registering a callback on the PDFViewerApplication eventbus
            PDFViewerApplication.pdfViewer.eventBus.on( 'textlayerrendered', FrontendController.registerSpanOnMouseOver );
        } catch ( e ) {
            setTimeout( FrontendController.waitForElement, 250 );
        }
    }

    static mousedownHandlerViewer( e ) {
        isMouseDown = true;
        mouseDownCache = "";
        previousTarget = null;
    }

    static mouseupHandlerViewer( e ) {
        isMouseDown = false;
        mouseDownCache = mouseDownCache.trim();
        if ( mouseDownCache.length > 0 ) {
            focusedInput.value = mouseDownCache;
            focusedInput.focus();
        }
    }

    unregisterMouseEvents() {
        if ( viewer ) {
            viewer.removeEventListener( 'mousedown', FrontendController.mousedownHandlerViewer );
            viewer.removeEventListener( 'mouseup', FrontendController.mouseupHandlerViewer );
        }
    }

    registerMouseEvents() {
        viewer = document.getElementById( 'viewer' );
        viewer.addEventListener( 'mousedown', FrontendController.mousedownHandlerViewer );
        viewer.addEventListener( 'mouseup', FrontendController.mouseupHandlerViewer );
    }

    setupIPC() {
        const $this = this;
        ipcRenderer.on( 'data-extraction-done', ( event, arg ) => {
            let newPdf = new Pdf( arg.filepath, arg.extracted_data );
            delete newPdf.extracted_data.seiten;
            $this.pdf_queue.append( newPdf );
            $this.sidebar.updateButtonLoadNextPdf();
            if ( $this.pdf_loaded == false ) {
                $this.nextPdf();
            }
        } );
    }

    registerDropAreaEvent() {
        document.getElementById( 'pdf_drop_area' ).addEventListener( 'drop', ( e ) => {
            e.preventDefault();
            e.stopPropagation();

            for ( const f of e.dataTransfer.files ) {
                console.log( 'File(s) you dragged here: ', f.path )
                let newPdf = new Pdf( f.path, undefined );
                ipcRenderer.send( 'extract-data-from-pdf', newPdf );
            }
        } );
        document.getElementById( 'pdf_drop_area' ).addEventListener( 'dragover', ( e ) => {
            e.preventDefault();
            e.stopPropagation();
        } );
    }

    async reset() {
        this.unregisterMouseEvents();
        FrontendController.removeSpanEventListener();
        this.pdf_loaded = false;
        await PDFViewerApplication.close();
        this.sidebar.clear();
        this.sidebar.updateButtonLoadNextPdf();
    }

    async loadPdf( pdf ) {
        this.pdf_loaded = true;
        await PDFViewerApplication.open( pdf.filepath );
        this.sidebar.fill( pdf.extracted_data );
        this.registerMouseEvents();
        this.sidebar.fields[ 0 ].input.focus(); // set focus to the first field in the sidebar
        this.sidebar.updateButtonLoadNextPdf();
    }

    nextPdf() {
        this.reset();
        if ( this.pdf_queue.size() > 0 ) {
            let pdf = this.pdf_queue.next();
            this.loadPdf( pdf );
        }
    }

    previousPdf() {
        this.reset();
        if ( this.pdf_queue.size() > 0 ) {
            let pdf = this.pdf_queue.previous();
            this.loadPdf( pdf );
        }
    }

    reloadPdf() {
        this.reset();
        if ( this.pdf_queue.size() > 0 ) {
            let pdf = this.pdf_queue.current();
            this.loadPdf( pdf );
        }
    }

    async deletePdfFromQueue() {
        console.log( 'deletePdfFromQueue called' );
        this.pdf_queue.removeAtIndex();
        await this.nextPdf();
    }

    async clearPdfQueue() {
        this.pdf_queue.clear();
        await this.nextPdf();
    }

    exportPdfData() {
        console.log( 'exportPdfData called' );
        if ( this.pdf_queue.size() > 0 ) {
            let pdf = this.pdf_queue.current();
            pdf.validated_data = this.sidebar.collectFieldValues();
            ipcRenderer.send( 'export-pdf-data', pdf );
            // TODO implement exportPdfData
            this.deletePdfFromQueue();
        }
    }

    /*
     * Triggers the "findagain" search event from viewer.js
     */
    static searchPdf( searchText ) {
        console.log( 'searchPdf called: ' + searchText );
        PDFViewerApplication.findController.executeCommand( 'findagain', {
            query: searchText,
            phraseSearch: true,
            caseSensitive: false,
            entireWord: false,
            highlightAll: false,
            findPrevious: undefined
        } );
    }
}

module.exports = FrontendController;
