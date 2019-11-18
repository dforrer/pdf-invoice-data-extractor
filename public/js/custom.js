// Requirements
const { ipcRenderer } = require('electron');

// Global variables
var userSearch      = true;
var textDivs_ref    = undefined;
var begin_divIdx    = undefined;
var end_divIdx      = undefined;
var pdf_queue       = [];
var pdf_queue_index = 0;
var viewer          = null; // div 'viewer' reference from PDFViewerApplication
var viewerSpans     = []; // Array of all the span-elements inside the viewer div
var isMouseDown     = false;
var mouseDownCache  = ''; // string to store the content of the current selection
var previousTarget  = null;
var focusedInput    = null;

// Object declarations
function PDF ( filepath, extracted_data ) {
    this.filepath = filepath;
    this.extracted_data = extracted_data;
}

// utility functions

/*
 * Functions to whitelist a string
 */
function removeChars( validChars, inputString, flags ) {
    var regex = new RegExp( '[^' + validChars + ']', flags );
    return inputString.replace( regex, '' );
}

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
        mouseDownCache += ' ' + e.target.innerText;
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
        console.log( e.target );
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
    var el = document.getElementById('load_next_pdf');
    if (pdf_queue.length > 0) {
        el.innerHTML = "Next (" + (pdf_queue_index + 1) + "/" +  pdf_queue.length + ")";
    } else {
        el.innerHTML = "Next (0/0)";
    }
}

function sendToSAP () {
    console.log('sendToSAP called');
    // TODO implement sendToSAP
    deletePDFFromQueue();
}

function loadJSONData() {
    var url = new URL( window.location.href );
    var path = url.searchParams.get("file");
    path = path.slice(0, -4);
    path = path + '.txt';
    console.log( path );
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

function validate_rechnungsart ( e ) {
    if ( 'R' === e.target.value.toUpperCase() || /rechnung|rg|invoice|faktur|factur/gi.test( e.target.value ) ) {
        e.target.value = 'R';
    } else if ('G' === e.target.value.toUpperCase() || /gutschrift|credit note|credit|crédit/gi.test( e.target.value ) ) {
        e.target.value = 'G';
    } else {
        // default value
        e.target.value = 'R';
    }
}

function validate_waehrung ( e ) {
    e.target.value = e.target.value.replace(/ /gm, '');
    if ( /chf|sfr/gi.test( e.target.value ) ) {
        e.target.value = 'CHF';
    } else if ( /eur|€/gi.test( e.target.value ) ) {
        e.target.value = 'EUR';
    } else if ( /usd|\$/gi.test( e.target.value ) ) {
        e.target.value = 'USD';
    } else if ( /gbp|£/gi.test( e.target.value ) ) {
        e.target.value = 'GBP';
    } else {
        // default value
        //e.target.value = 'CHF';
    }
}

function validate_endbetrag ( e ) {
    var output = e.target.value;
    // remove whitespace from front and end
    output = output.trim();
    outputSplit = output.split('');
    if ( outputSplit[ outputSplit.length - 2 ] == ' ' ) {
        outputSplit.splice( outputSplit.length - 2);
    }
    output = outputSplit.join('');
    // replace all non-digits (commas, dots, upticks) with dots
    output = output.replace(/\D/g, '.');
    // replace all but the last dot with nothing
    output = parseFloat( output.replace(/\.(?![^.]+$)|[^0-9.]/g, ''));
    e.target.value = output.toFixed(2);
}

function validate_esr_konto ( e ) {
    var whitelist = '1234567890-';
    var flags = 'gm';
    e.target.value = removeChars( whitelist, e.target.value, flags );
}

function validate_esr_referenz ( e ) {
    var whitelist = '1234567890';
    var flags = 'gm';
    e.target.value = removeChars( whitelist, e.target.value, flags );
}

function fillExtractorSidebar ( json ) {
    removeInputsFromExtractorContainer();
    addInputDiv ( 'Rechnungsart', json.rechnungsart[0], validate_rechnungsart);
    addInputDiv ( 'Kreditor', json.kreditor[0] );
    addInputDiv ( 'Name', json.name[0] );
    addInputDiv ( 'Rg. Nummer', json.rg_nummer[0] );
    addInputDiv ( 'Rg. Datum', json.rg_datum[0] );
    addInputDiv ( 'Währung', json.waehrung[0], validate_waehrung );
    addInputDiv ( 'Endbetrag', json.endbetrag[0], validate_endbetrag );
    addInputDiv ( 'ESR Konto', json.esr_konto[0], validate_esr_konto );
    addInputDiv ( 'ESR Referenz', json.esr_referenz[0], validate_esr_referenz );
    addInputDiv ( 'MwSt-Nr.', json.mwst[0] );
    addInputDiv ( 'IBAN', json.iban[0] );
    addInputDiv ( 'Email', json.email[0] );
}

function addInputDiv ( name, match, onBlurFunction ) {
    var div_register = document.createElement('div');
    div_register.setAttribute('class', 'register');

    var div_field = document.createElement('div');
    div_field.setAttribute('class', 'field');

    var label = document.createElement('label');
    label.setAttribute('for', 'register');

    var span = document.createElement('span');
    span.innerHTML = name;

    var input = document.createElement('input');
    var inputname = 'input_' + name.toLowerCase();
    input.setAttribute( 'Id', inputname );
    input.type = 'text';
    input.readonly = true;
    if ( match ) {
        input.value = match.value;
        input.ondblclick = function() { searchPDF(match.match);
        }
    }
    input.addEventListener( 'focus', function ( e ) {
        focusedInput = e.target;
    });

    // validate input on blur
    input.addEventListener( 'blur', onBlurFunction );

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
