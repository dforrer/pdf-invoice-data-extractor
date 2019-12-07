// Requirements
const {ipcRenderer} = require('electron');
const validators    = require('./js/validators.js');
const settings      = require('./../settings.json');

// Model variables
var pdf_queue       = [];
var pdf_queue_index = 0;

// GUI variables
var userSearch      = true;
var textDivs_ref    = undefined;
var begin_divIdx    = undefined;
var end_divIdx      = undefined;
var viewer          = null; // div 'viewer' reference from PDFViewerApplication
var viewerSpans     = []; // Array of all the span-elements inside the viewer div
var isMouseDown     = false;
var mouseDownCache  = ''; // string to store the content of the current selection
var previousTarget  = null;
var focusedInput    = null;

// Model object declarations
function PDF ( filepath, extracted_data ) {
    this.filepath = filepath;
    this.extracted_data = extracted_data;
}

// utility functions


// Register keyboard shortcuts
window.addEventListener('keyup', function (e) {
    if (e.ctrlKey  &&  e.key.toLowerCase() === "n") {
        nextPDF( 1 );
    } else if (e.ctrlKey  &&  e.key.toLowerCase() === "b") {
        nextPDF( -1 );
    }
});

/* Here we listen for the custom event from viewer.js */
document.addEventListener('pdf_finished_rendering', function (e) {
    registerSpanOnMouseOver();
}, true);

function mousemoveHandler ( e ) {
    if ( isMouseDown && e.target !== previousTarget ) {
        mouseDownCache += '' + e.target.innerText;
    }
    previousTarget = e.target;
}

function dblclickHandler (e) {
    if ( e.target !== previousTarget ) {
        mouseDownCache += e.target.innerText;
    }
    previousTarget = e.target;
    if ( mouseDownCache.length > 0 ) {
        focusedInput.value = mouseDownCache;
        focusedInput.focus();
    }
}

function addSpanEventListener () {
    for ( var i = 0; i < viewerSpans.length; i++) {
        viewerSpans[i].addEventListener( 'mousemove', mousemoveHandler );
        viewerSpans[i].addEventListener( 'dblclick', dblclickHandler );
    }
}

function removeSpanEventListener () {
    for ( var i = 0; i < viewerSpans.length; i++) {
        viewerSpans[i].removeEventListener( 'mousemove', mousemoveHandler );
        viewerSpans[i].removeEventListener( 'dblclick', dblclickHandler );
    }
}

function registerSpanOnMouseOver() {
    removeSpanEventListener();
    viewerSpans = Array.from(viewer.getElementsByTagName('span'));
    addSpanEventListener();
}

function mousedownHandlerViewer ( e ) {
    isMouseDown = true;
    mouseDownCache = "";
    previousTarget = null;
}

function mouseupHandlerViewer ( e ) {
    isMouseDown = false;
    mouseDownCache = mouseDownCache.trim();
    if ( mouseDownCache.length > 0 ) {
        focusedInput.value = mouseDownCache;
        focusedInput.focus();
    }
}

function unregisterMouseEvents () {
    if ( viewer ) {
        viewer.removeEventListener( 'mousedown', mousedownHandlerViewer );
        viewer.removeEventListener( 'mouseup', mouseupHandlerViewer );
    }
}

function registerMouseEvents () {
    viewer = document.getElementById( 'viewer' );
    viewer.addEventListener( 'mousedown', mousedownHandlerViewer );
    viewer.addEventListener( 'mouseup', mouseupHandlerViewer );
}

function setupIPC() {
    // In renderer process (web page).
    ipcRenderer.on('data-extraction-done', (event, arg) => {
        var newPDF = new PDF( arg.filepath, arg.extracted_data );
        delete newPDF.extracted_data.seiten;
        pdf_queue.push( newPDF );
        update_button_load_next_pdf();
        if ( PDFViewerApplication.pdfDocument == null ) {
            pdf_queue_index = -1;
            nextPDF( 1 );
        }
    });
}

function setFocusToInput( inputname ){
    document.getElementById( inputname ).focus();
}

function registerDropAreaEvent() {
    document.getElementById('pdf_drop_area').addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        for (const f of e.dataTransfer.files) {
            console.log('File(s) you dragged here: ', f.path)
            var newPDF = new PDF( f.path, undefined );
            ipcRenderer.send( 'extract-data-from-pdf', newPDF );
        }
    });
    document.getElementById('pdf_drop_area').addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
}

function nextPDF( plusMinusOne ) {
    unregisterMouseEvents();
    removeSpanEventListener();
    PDFViewerApplication.close();
    removeInputsFromExtractorContainer();
    if ( pdf_queue.length > 0 ) {
        pdf_queue_index += plusMinusOne;
        if ( pdf_queue_index < 0 ) {
            pdf_queue_index = pdf_queue.length - 1;
        }
        pdf_queue_index = pdf_queue_index % pdf_queue.length;
        var next_pdf = pdf_queue[ pdf_queue_index ];
        PDFViewerApplication.open( next_pdf.filepath );
        fillExtractorSidebar( next_pdf.extracted_data );
        registerMouseEvents();
        setFocusToInput( 'input_rechnungsart' );
    }
    update_button_load_next_pdf();
}

function deletePDFFromQueue() {
    console.log('deletePDFFromQueue called');
    pdf_queue.splice(pdf_queue_index, 1);
    if ( pdf_queue_index >= 1 ) {
        pdf_queue_index -= 1;
    }
    nextPDF( -1 );
}

function update_button_load_next_pdf () {
    var el = document.getElementById('current_pdf');
    if (pdf_queue.length > 0) {
        el.innerHTML = (pdf_queue_index + 1) + "/" +  pdf_queue.length ;
    } else {
        el.innerHTML = "0/0";
    }
}

function exportPDFData() {
    console.log('exportPDFData called');
    if ( pdf_queue.length > 0 ) {
        var pdf = pdf_queue[ pdf_queue_index ];
        pdf.validated_data = collectExtractorContainerData();
        ipcRenderer.send( 'export-pdf-data', pdf );
        // TODO implement exportPDFData
        deletePDFFromQueue();
    }
}

function loadJSONData() {
    var url = new URL( window.location.href );
    var path = url.searchParams.get("file");
    path = path.slice(0, -4);
    path = path + '.txt';
    // load JSON for PDF file
    fetch( path )
      .then(response => {
        return response.json()
      })
      .then(data => {
        // Work with JSON data here
        delete data.seiten;
        fillExtractorSidebar(data);
      })
      .catch(err => {
        // Do something for an error here
        console.error('ERROR loading JSON');
      })
}

function removeInputsFromExtractorContainer() {
    var extractorContainer = document.getElementById('extracted_data');
    // remove all childnodes
    while (extractorContainer.firstChild) {
        extractorContainer.removeChild(extractorContainer.firstChild);
    }
}

function getInputValue( inputname ) {
    return document.getElementById( 'input_' +inputname ).value;
}

function collectExtractorContainerData() {
    var validated_data = {};
    validated_data[ 'rechnungsart' ] = getInputValue( 'rechnungsart' );
    validated_data[ 'kreditor' ] = getInputValue( 'kreditor' );
    validated_data[ 'name' ] = getInputValue( 'name' );
    validated_data[ 'rg_nummer' ] = getInputValue( 'rg_nummer' );
    validated_data[ 'rg_datum' ] = getInputValue( 'rg_datum' );
    validated_data[ 'waehrung' ] = getInputValue( 'waehrung' );
    validated_data[ 'endbetrag' ] = getInputValue( 'endbetrag' );
    validated_data[ 'esr_konto' ] = getInputValue( 'esr_konto' );
    validated_data[ 'esr_referenz' ] = getInputValue( 'esr_referenz' );
    validated_data[ 'mwst' ] = getInputValue( 'mwst' );
    validated_data[ 'iban' ] = getInputValue( 'iban' );
    validated_data[ 'email' ] = getInputValue( 'email' );
    validated_data[ 'telefon' ] = getInputValue( 'telefon' );
    return validated_data;
}

function fillExtractorSidebar ( json ) {
    removeInputsFromExtractorContainer();
    addInputDiv ( 'Rechnungsart (R/G)', json, 'rechnungsart', validators.validate_rechnungsart);
    addInputDiv ( 'Kreditor', json, 'kreditor', validators.validate_kreditor );
    addInputDiv ( 'Name', json, 'name' );
    addInputDiv ( 'Rg. Nummer', json, 'rg_nummer', validators.validate_rg_nummer );
    addInputDiv ( 'Rg. Datum', json, 'rg_datum', validators.validate_rg_datum );
    addInputDiv ( 'Währung', json, 'waehrung', validators.validate_waehrung );
    addInputDiv ( 'Endbetrag', json, 'endbetrag', validators.validate_endbetrag );
    addInputDiv ( 'ESR Konto', json, 'esr_konto', validators.validate_esr_konto );
    addInputDiv ( 'ESR Referenz', json, 'esr_referenz', validators.validate_esr_referenz );
    addInputDiv ( 'MwSt-Nr.', json, 'mwst' );
    addInputDiv ( 'IBAN', json, 'iban' );
    addInputDiv ( 'Email', json, 'email' );
    addInputDiv ( 'Telefon', json, 'telefon' );
}

function addInputDiv ( name, json, key, validateFunc ) {
    var div_register = document.createElement('div');
    div_register.setAttribute('class', 'register');

    var div_field = document.createElement('div');
    div_field.setAttribute('class', 'field');

    var label = document.createElement('label');
    label.setAttribute('for', 'register');

    var span = document.createElement('span');
    span.innerHTML = name;

    var input = document.createElement('input');
    var inputname = 'input_' + key;
    input.setAttribute( 'Id', inputname );
    input.setAttribute( 'name', key );
    input.setAttribute( 'class', 'valid' );
    input.type = 'text';
    input.readonly = true;
    var match = json[key][0];
    if ( match ) {
        input.value = match.value;
        input.ondblclick = function() { searchPDF(match.match); }
    }
    input.addEventListener( 'focus', function ( e ) {
        focusedInput = e.target;
    });

    var input_validation = function ( e ) {
        if ( validateFunc ) {
            var rv = validateFunc( e.target.value );
            e.target.value = rv.output;
            if ( rv.valid === false ) {
                e.target.classList.remove('valid');
                e.target.classList.add('invalid');
            } else {
                e.target.classList.remove('invalid');
                e.target.classList.add('valid');
            }
        }
    };
    // validate input on blur
    input.addEventListener( 'blur', input_validation );

    // validate input on ENTER keypress
    input.addEventListener( 'keypress', function ( e ) {
        var keypress = e.which || e.keyCode;
        if ( keypress === 13 ) { // 13 is enter
            input_validation( e );
        }
    });

    // Putting it all together
    label.appendChild(span);
    div_field.appendChild(label);
    div_field.appendChild(input);
    div_register.appendChild(div_field);
    var extractorContainer = document.getElementById('extracted_data');
    extractorContainer.appendChild( div_register );
}

/*
 * Triggers the "normal" search function from pdf.js by creating an event
 * adapted from https://stackoverflow.com/questions/34717771/search-using-code-on-embedded-pdfjs
 */
function searchPDF(td_text)
{
    //PDFViewerApplication.pdfViewer.scrollPageIntoView({pageNumber:1, destArray:0, allowNegativeOffset: false})
    unhighlightMatch1();    // before highlighting the next text, unhighlight the previous find
    userSearch = false;
    PDFViewerApplication.findBar.open();
    PDFViewerApplication.findBar.findField.value = td_text;

    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('findagain', true, true, {
        query: td_text,
        caseSensitive: false,
        highlightAll: true,
        findPrevious: undefined
    });

    PDFViewerApplication.findBar.dispatchEvent('');
    document.getElementById("findbar").style.display = "none"; // hide the findbar temporarily
    return event;
}

/*
 * Called by TextLayerBuilder function _renderMatches
 */
function highlightMatch1( matches, textDivs ) {
    begin_divIdx = matches[0].begin.divIdx;
    end_divIdx   = matches[0].end.divIdx;
    textDivs_ref = textDivs; // store a reference to textDivs to later unhighlight from begin_divIdx to end_divIdx
    PDFViewerApplication.findBar.close();
    document.getElementById("findbar").style.display = ""; // show the findbar again
    userSearch = true; // re-enable normal user searches
}

/*
 * Function to clear the highlighted div's childnodes
 */
function unhighlightMatch1() {
    document.getElementById("findbar").style.display = ""; // show the findbar again
    userSearch = true; // re-enable normal user searches
    if ( begin_divIdx !== undefined ) {
        // unhighlight all divs from begin_divIdx to end_divIdx
        for (var n = begin_divIdx, end = end_divIdx; n <= end; n++) {
          var div = textDivs_ref[n];
          div.className = '';
          if ( n == begin_divIdx || n == end ) {
              // also remove the highlight class from begin and end-divs
              var c = div.childNodes;
              for (var i = 0 ; i < c.length ; i++ ) {
                c[i].className = '';
              }
          }
        }
    }
}
