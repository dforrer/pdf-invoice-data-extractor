// Requirements
const {
    ipcRenderer
} = require( 'electron' );
const settings = require( './../../config/settings.json' );
const sidebar_config = require( settings.sidebar_config );
const SuppliersLoader = require( '../extractor/SuppliersLoader.js' );

// load suppliers
const suppliers_loader = new SuppliersLoader();
suppliers_loader.loadFromCsv( settings[ 'suppliers_csv_path' ], function() {
    console.log( 'loadSuppliers finished' );
} );

// Model variables
var pdf_queue = [];
var pdf_queue_index = 0;
var pdf_loaded = false;

// GUI variables
var viewer = null; // div 'viewer' reference from PDFViewerApplication
var viewerSpans = []; // Array of all the span-elements inside the viewer div
var isMouseDown = false;
var mouseDownCache = ''; // string to store the content of the current selection
var previousTarget = null;
var focusedInput = null;

// Model object declarations
function Pdf( filepath, extracted_data ) {
    this.filepath = filepath;
    this.extracted_data = extracted_data;
}

// utility functions


// Register keyboard shortcuts
window.addEventListener( 'keyup', function( e ) {
    if ( e.ctrlKey && e.key.toLowerCase() === "n" ) {
        nextPdf( 1 );
    } else if ( e.ctrlKey && e.key.toLowerCase() === "b" ) {
        nextPdf( -1 );
    }
} );

function waitForElement() {
    try {
        // try registering a callback on the PDFViewerApplication eventbus
        PDFViewerApplication.pdfViewer.eventBus.on( 'textlayerrendered', registerSpanOnMouseOver );
    } catch ( e ) {
        setTimeout( waitForElement, 250 );
    }
}

waitForElement();

function mousemoveHandler( e ) {
    if ( isMouseDown && e.target !== previousTarget ) {
        mouseDownCache += '' + e.target.innerText;
    }
    previousTarget = e.target;
}

function dblclickHandler( e ) {
    if ( e.target !== previousTarget ) {
        mouseDownCache += e.target.innerText;
    }
    previousTarget = e.target;
    if ( mouseDownCache.length > 0 ) {
        focusedInput.value = mouseDownCache;
        focusedInput.focus();
    }
}

function addSpanEventListener() {
    for ( var i = 0; i < viewerSpans.length; i++ ) {
        viewerSpans[ i ].addEventListener( 'mousemove', mousemoveHandler );
        viewerSpans[ i ].addEventListener( 'dblclick', dblclickHandler );
    }
}

function removeSpanEventListener() {
    for ( var i = 0; i < viewerSpans.length; i++ ) {
        viewerSpans[ i ].removeEventListener( 'mousemove', mousemoveHandler );
        viewerSpans[ i ].removeEventListener( 'dblclick', dblclickHandler );
    }
}

function registerSpanOnMouseOver() {
    removeSpanEventListener();
    viewerSpans = Array.from( viewer.getElementsByTagName( 'span' ) );
    addSpanEventListener();
}

function mousedownHandlerViewer( e ) {
    isMouseDown = true;
    mouseDownCache = "";
    previousTarget = null;
}

function mouseupHandlerViewer( e ) {
    isMouseDown = false;
    mouseDownCache = mouseDownCache.trim();
    if ( mouseDownCache.length > 0 ) {
        focusedInput.value = mouseDownCache;
        focusedInput.focus();
    }
}

function unregisterMouseEvents() {
    if ( viewer ) {
        viewer.removeEventListener( 'mousedown', mousedownHandlerViewer );
        viewer.removeEventListener( 'mouseup', mouseupHandlerViewer );
    }
}

function registerMouseEvents() {
    viewer = document.getElementById( 'viewer' );
    viewer.addEventListener( 'mousedown', mousedownHandlerViewer );
    viewer.addEventListener( 'mouseup', mouseupHandlerViewer );
}

function setupIPC() {
    // In renderer process (web page).
    ipcRenderer.on( 'data-extraction-done', ( event, arg ) => {
        var newPdf = new Pdf( arg.filepath, arg.extracted_data );
        delete newPdf.extracted_data.seiten;
        pdf_queue.push( newPdf );
        updateButtonLoadNextPdf();
        if ( !pdf_loaded ) {
            pdf_loaded = true;
            pdf_queue_index = -1;
            nextPdf( 1 );
        }
    } );
}

function setFocusToInput( inputname ) {
    document.getElementById( inputname ).focus();
}

function registerDropAreaEvent() {
    document.getElementById( 'pdf_drop_area' ).addEventListener( 'drop', ( e ) => {
        e.preventDefault();
        e.stopPropagation();

        for ( const f of e.dataTransfer.files ) {
            console.log( 'File(s) you dragged here: ', f.path )
            var newPdf = new Pdf( f.path, undefined );
            ipcRenderer.send( 'extract-data-from-pdf', newPdf );
        }
    } );
    document.getElementById( 'pdf_drop_area' ).addEventListener( 'dragover', ( e ) => {
        e.preventDefault();
        e.stopPropagation();
    } );
}

async function nextPdf( plusMinusOne ) {
    unregisterMouseEvents();
    removeSpanEventListener();
    pdf_loaded = false;
    await PDFViewerApplication.close();
    removeInputsFromExtractorContainer();
    if ( pdf_queue.length > 0 ) {
        pdf_queue_index += plusMinusOne;
        if ( pdf_queue_index < 0 ) {
            pdf_queue_index = pdf_queue.length - 1;
        }
        pdf_queue_index = pdf_queue_index % pdf_queue.length;
        var next_pdf = pdf_queue[ pdf_queue_index ];
        pdf_loaded = true;
        await PDFViewerApplication.open( next_pdf.filepath );
        fillExtractorSidebar( next_pdf.extracted_data );
        registerMouseEvents();
        setFocusToInput( 'input_invoice_type' );
    }
    updateButtonLoadNextPdf();
}

async function deletePdfFromQueue() {
    console.log( 'deletePdfFromQueue called' );
    pdf_queue.splice( pdf_queue_index, 1 );
    if ( pdf_queue_index >= 1 ) {
        pdf_queue_index -= 1;
    }
    await nextPdf( -1 );
}

function updateButtonLoadNextPdf() {
    var el = document.getElementById( 'current_pdf' );
    if ( pdf_queue.length > 0 ) {
        el.innerHTML = ( pdf_queue_index + 1 ) + "/" + pdf_queue.length;
    } else {
        el.innerHTML = "0/0";
    }
}

function exportPdfData() {
    console.log( 'exportPdfData called' );
    if ( pdf_queue.length > 0 ) {
        var pdf = pdf_queue[ pdf_queue_index ];
        pdf.validated_data = collectExtractorContainerData();
        ipcRenderer.send( 'export-pdf-data', pdf );
        // TODO implement exportPdfData
        deletePdfFromQueue();
    }
}

function removeInputsFromExtractorContainer() {
    var extractorContainer = document.getElementById( 'extracted_data' );
    // remove all childnodes
    while ( extractorContainer.firstChild ) {
        extractorContainer.removeChild( extractorContainer.firstChild );
    }
}

function getInputValue( inputname ) {
    return document.getElementById( 'input_' + inputname ).value;
}

function collectExtractorContainerData() {
    var validated_data = {};
    for ( var i = 0; i < sidebar_config.extractor_container_fields.length; i++ ) {
        var f = sidebar_config.extractor_container_fields[ i ];
        if ( f.display_name != null ) {
            validated_data[ f.field ] = getInputValue( f.field );
        }
    }
    return validated_data;
}

function fillExtractorSidebar( json ) {
    removeInputsFromExtractorContainer();

    // sort based on display_position field
    var sidebar_fields = sidebar_config.extractor_container_fields;
    sidebar_fields = sidebar_fields.sort( function( a, b ) {
        return a.display_position - b.display_position;
    } );

    for ( var i = 0; i < sidebar_fields.length; i++ ) {
        var f = sidebar_fields[ i ];
        if ( f.display_name != null ) {
            try {
                var ValidatorClass = require( '../extractor/' + f.validator_class + '.js' );
                addInputDiv( f.display_name, json, f.field, new ValidatorClass().validate );
            } catch ( e ) {
                addInputDiv( f.display_name, json, f.field );
            }
        }
    }
}

function addInputDiv( name, json, key, validateFunc ) {
    var div_register = document.createElement( 'div' );
    div_register.setAttribute( 'class', 'register' );

    var div_field = document.createElement( 'div' );
    div_field.setAttribute( 'class', 'field' );

    var label = document.createElement( 'label' );
    label.setAttribute( 'for', 'register' );

    var span = document.createElement( 'span' );
    span.innerHTML = name;

    var input = document.createElement( 'input' );
    var inputname = 'input_' + key;
    input.setAttribute( 'Id', inputname );
    input.setAttribute( 'name', key );
    input.setAttribute( 'class', 'valid' );
    input.type = 'text';
    input.readonly = true;
    var match = json[ key ][ 0 ];
    if ( match ) {
        input.value = match.value;
        input.ondblclick = function() {
            searchPdf( match.match );
        }
    }
    input.addEventListener( 'focus', function( e ) {
        focusedInput = e.target;
    } );

    var input_validation = function( e ) {
        if ( validateFunc ) {
            var rv = validateFunc( e.target.value, suppliers_loader );
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
        var keypress = e.which || e.keyCode;
        if ( keypress === 13 ) { // 13 is enter
            input_validation( e );
        }
    } );

    // Putting it all together
    label.appendChild( span );
    div_field.appendChild( label );
    div_field.appendChild( input );
    div_register.appendChild( div_field );
    var extractorContainer = document.getElementById( 'extracted_data' );
    extractorContainer.appendChild( div_register );
}

/*
 * Triggers the "findagain" search event from viewer.js
 */
async function searchPdf( searchText ) {
    await PDFViewerApplication.findController.executeCommand( 'findagain', {
        query: searchText,
        phraseSearch: true,
        caseSensitive: false,
        entireWord: false,
        highlightAll: false,
        findPrevious: undefined
    } );
}
