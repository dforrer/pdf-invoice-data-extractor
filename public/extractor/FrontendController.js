// Requirements
const {
    ipcRenderer
} = require( 'electron' );
// Local requirements
const settings = require( './../../settings.json' );
const sidebar_config = require( settings.sidebar_config );
const SuppliersLoader = require( '../extractor/SuppliersLoader.js' );

// Global
let pdf_queue = [];
let pdf_queue_index = 0;

// GUI variables
let viewer = null; // div 'viewer' reference from PDFViewerApplication
let viewerSpans = []; // Array of all the span-elements inside the viewer div
let isMouseDown = false;
let mouseDownCache = ''; // string to store the content of the current selection
let previousTarget = null;
let focusedInput = null;

let suppliers_loader = new SuppliersLoader();
suppliers_loader.loadFromCsv( settings[ 'suppliers_csv_path' ], function() {
    console.log( 'loadSuppliers finished' );
} );

// Model object declarations
class Pdf {
    constructor( filepath, extracted_data ) {
        this.filepath = filepath;
        this.extracted_data = extracted_data;
    }
}

/**
 *
 * @class
 */
class FrontendController {

    constructor() {}

    //====================
    // Public methods
    //====================

    registerKeyboardHandler() {
        // Register keyboard shortcuts
        const $this = this;
        window.addEventListener( 'keyup', function( e ) {
            if ( e.ctrlKey && e.key.toLowerCase() === "n" ) {
                $this.nextPdf( 1 );
            } else if ( e.ctrlKey && e.key.toLowerCase() === "b" ) {
                $this.nextPdf( -1 );
            }
        } );
    }

    mousemoveHandler( e ) {
        console.log( 'mousemoveHandler' );
        if ( isMouseDown && e.target !== previousTarget ) {
            mouseDownCache += '' + e.target.innerText;
        }
        previousTarget = e.target;
    }

    dblclickHandler( e ) {
        console.log( 'dblclickHandler' );
        if ( e.target !== previousTarget ) {
            mouseDownCache += e.target.innerText;
        }
        previousTarget = e.target;
        if ( mouseDownCache.length > 0 ) {
            focusedInput.value = mouseDownCache;
            focusedInput.focus();
        }
    }

    addSpanEventListener() {
        for ( let i = 0; i < viewerSpans.length; i++ ) {
            viewerSpans[ i ].addEventListener( 'mousemove', this.mousemoveHandler );
            viewerSpans[ i ].addEventListener( 'dblclick', this.dblclickHandler );
        }
    }

    removeSpanEventListener() {
        for ( let i = 0; i < viewerSpans.length; i++ ) {
            viewerSpans[ i ].removeEventListener( 'mousemove', this.mousemoveHandler );
            viewerSpans[ i ].removeEventListener( 'dblclick', this.dblclickHandler );
        }
    }

    registerSpanOnMouseOver() {
        this.removeSpanEventListener();
        viewerSpans = Array.from( viewer.getElementsByTagName( 'span' ) );
        this.addSpanEventListener();
    }

    mousedownHandlerViewer( e ) {
        isMouseDown = true;
        mouseDownCache = "";
        previousTarget = null;
    }

    mouseupHandlerViewer( e ) {
        isMouseDown = false;
        mouseDownCache = mouseDownCache.trim();
        if ( mouseDownCache.length > 0 ) {
            focusedInput.value = mouseDownCache;
            focusedInput.focus();
        }
    }

    unregisterMouseEvents() {
        if ( viewer ) {
            viewer.removeEventListener( 'mousedown', this.mousedownHandlerViewer );
            viewer.removeEventListener( 'mouseup', this.mouseupHandlerViewer );
        }
    }

    registerMouseEvents() {
        viewer = document.getElementById( 'viewer' );
        viewer.addEventListener( 'mousedown', this.mousedownHandlerViewer );
        viewer.addEventListener( 'mouseup', this.mouseupHandlerViewer );
    }

    setupIPC() {
        // In renderer process (web page).
        ipcRenderer.on( 'data-extraction-done', ( event, arg ) => {
            let newPdf = new Pdf( arg.filepath, arg.extracted_data );
            delete newPdf.extracted_data.seiten;
            pdf_queue.push( newPdf );
            this.updateButtonLoadNextPdf();
            if ( PDFViewerApplication.pdfDocument == null ) {
                pdf_queue_index = -1;
                this.nextPdf( 1 );
            }
        } );
    }

    setFocusToInput( inputname ) {
        document.getElementById( inputname ).focus();
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

    async nextPdf( plusMinusOne ) {
        this.unregisterMouseEvents();
        this.removeSpanEventListener();
        await PDFViewerApplication.close();
        this.removeInputsFromExtractorContainer();
        if ( pdf_queue.length > 0 ) {
            pdf_queue_index += plusMinusOne;
            if ( pdf_queue_index < 0 ) {
                pdf_queue_index = pdf_queue.length - 1;
            }
            pdf_queue_index = pdf_queue_index % pdf_queue.length;
            let next_pdf = pdf_queue[ pdf_queue_index ];
            await PDFViewerApplication.open( next_pdf.filepath );
            this.fillExtractorSidebar( next_pdf.extracted_data );
            this.registerMouseEvents();
            this.setFocusToInput( 'input_invoice_type' );
        }
        this.updateButtonLoadNextPdf();
    }

    async deletePdfFromQueue() {
        console.log( 'deletePdfFromQueue called' );
        pdf_queue.splice( pdf_queue_index, 1 );
        if ( pdf_queue_index >= 1 ) {
            pdf_queue_index -= 1;
        }
        await this.nextPdf( -1 );
    }

    updateButtonLoadNextPdf() {
        let el = document.getElementById( 'current_pdf' );
        if ( pdf_queue.length > 0 ) {
            el.innerHTML = ( pdf_queue_index + 1 ) + "/" + pdf_queue.length;
        } else {
            el.innerHTML = "0/0";
        }
    }

    exportPdfData() {
        console.log( 'exportPdfData called' );
        if ( pdf_queue.length > 0 ) {
            let pdf = pdf_queue[ pdf_queue_index ];
            pdf.validated_data = this.collectExtractorContainerData();
            ipcRenderer.send( 'export-pdf-data', pdf );
            // TODO implement exportPdfData
            this.deletePdfFromQueue();
        }
    }

    removeInputsFromExtractorContainer() {
        let extractorContainer = document.getElementById( 'extracted_data' );
        // remove all childnodes
        while ( extractorContainer.firstChild ) {
            extractorContainer.removeChild( extractorContainer.firstChild );
        }
    }

    getInputValue( inputname ) {
        return document.getElementById( 'input_' + inputname ).value;
    }

    collectExtractorContainerData() {
        let validated_data = {};
        for ( let i = 0; i < sidebar_config.extractor_container_fields.length; i++ ) {
            let f = sidebar_config.extractor_container_fields[ i ];
            if ( f.display_name != null ) {
                validated_data[ f.field ] = this.getInputValue( f.field );
            }
        }
        return validated_data;
    }

    fillExtractorSidebar( json ) {
        this.removeInputsFromExtractorContainer();

        // sort based on display_position field
        let sidebar_fields = sidebar_config.extractor_container_fields;
        sidebar_fields = sidebar_fields.sort( function( a, b ) {
            return a.display_position - b.display_position;
        } );

        for ( let i = 0; i < sidebar_fields.length; i++ ) {
            let f = sidebar_fields[ i ];
            if ( f.display_name != null ) {
                try {
                    let ValidatorClass = require( '../extractor/' + f.validator_class + '.js' );
                    let validClass = new ValidatorClass();
                    this.addInputDiv( f.display_name, json, f.field, validClass.validate );
                } catch ( e ) {
                    this.addInputDiv( f.display_name, json, f.field );
                }
            }
        }
    }

    addInputDiv( name, json, key, validateFunc ) {
        let div_register = document.createElement( 'div' );
        div_register.setAttribute( 'class', 'register' );

        let div_field = document.createElement( 'div' );
        div_field.setAttribute( 'class', 'field' );

        let label = document.createElement( 'label' );
        label.setAttribute( 'for', 'register' );

        let span = document.createElement( 'span' );
        span.innerHTML = name;

        let input = document.createElement( 'input' );
        let inputname = 'input_' + key;
        input.setAttribute( 'Id', inputname );
        input.setAttribute( 'name', key );
        input.setAttribute( 'class', 'valid' );
        input.type = 'text';
        input.readonly = true;
        let match = json[ key ][ 0 ];
        if ( match ) {
            input.value = match.value;
            input.ondblclick = () => {
                this.searchPdf( match.match );
            };
        }
        input.addEventListener( 'focus', function( e ) {
            focusedInput = e.target;
        } );
        const input_validation = ( e ) => {
            if ( validateFunc ) {
                let rv = validateFunc( e.target.value, suppliers_loader );
                e.target.value = rv.output;
                if ( rv.valid === false ) {
                    e.target.classList.remove( 'valid' );
                    e.target.classList.add( 'invalid' );
                } else {
                    e.target.classList.remove( 'invalid' );
                    e.target.classList.add( 'valid' );
                }
            }
        };
        // validate input on blur
        input.addEventListener( 'blur', input_validation );

        // validate input on ENTER keypress
        input.addEventListener( 'keypress', function( e ) {
            let keypress = e.which || e.keyCode;
            if ( keypress === 13 ) { // 13 is enter
                input_validation( e );
            }
        } );

        // Putting it all together
        label.appendChild( span );
        div_field.appendChild( label );
        div_field.appendChild( input );
        div_register.appendChild( div_field );
        let extractorContainer = document.getElementById( 'extracted_data' );
        extractorContainer.appendChild( div_register );
    }

    /*
     * Triggers the "findagain" search event from viewer.js
     */
    searchPdf( searchText ) {
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
