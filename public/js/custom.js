// Requirements
const { ipcRenderer } = require('electron');

// Global variables
var userSearch   = true;
var textDivs_ref = undefined;
var begin_divIdx = undefined;
var end_divIdx   = undefined;

var pdf_queue    = [];
var pdf_queue_index = 0;

function PDF ( filepath, extracted_data ) {
    this.filepath = filepath;
    this.extracted_data = extracted_data;
}

function extractJsonFromPDF ( inputfile, cb ) {
    const pdfExtract = new PDFExtract();
    const options = {};

    pdfExtract.extract(inputfile, options, (err, data) => {
        if (err) return console.log(err);
        cb(err, data);
    });
}

function setupIPC() {
    // In renderer process (web page).
    ipcRenderer.on('data-extraction-done', (event, arg) => {
        var newPDF = new PDF( arg.filepath, arg.extracted_data );
        delete newPDF.extracted_data.seiten;
        pdf_queue.push( newPDF );
        update_button_load_next_pdf();
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

function nextPDF() {
    if ( pdf_queue.length > 0 ) {
        pdf_queue_index += 1;
        pdf_queue_index = pdf_queue_index % pdf_queue.length;
        var next_pdf = pdf_queue[ pdf_queue_index ];
        PDFViewerApplication.open( next_pdf.filepath );
        iterateAttribues( next_pdf.extracted_data );
    } else {
        PDFViewerApplication.close();
        removeInputsFromExtractorContainer();
    }
    update_button_load_next_pdf();
}

function deletePDFFromQueue() {
    console.log('deletePDFFromQueue called');
    pdf_queue.splice(pdf_queue_index, 1);
    if ( pdf_queue_index >= 1 ) {
        pdf_queue_index -= 1;
    }
    nextPDF();
}

function update_button_load_next_pdf () {
    var el = document.getElementById('load_next_pdf');
    if (pdf_queue.length > 0) {
        el.innerHTML = "Nächstes PDF laden (" + (pdf_queue_index + 1) + "/" +  pdf_queue.length + ")";
    } else {
        el.innerHTML = "Nächstes PDF laden (0/0)";
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
        iterateAttribues(data);
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

function iterateAttribues ( json ) {
    removeInputsFromExtractorContainer();
    for (const p of Object.entries( json )) {
        var key   = p[0];
        var matchArray = p[1];
        switch ( key ) {
            case 'mwst':
            case 'iban':
            case 'email':
            case 'esr_betrag':
                continue;
            case 'rg_nummer':
                key = 'Rg. Nummer'
                break;
            case 'rg_datum':
                key = 'Rg. Datum'
                break;
            case 'esr_konto':
                key = 'ESR Konto'
                break;
            case 'esr_referenz':
                key = 'ESR Referenz'
                break;
            default:
        }
        addInputDiv ( key, matchArray[0]);
    }
}

function addInputDiv ( name, match ) {
    var div_register = document.createElement('div');
    div_register.setAttribute('class', 'register');

    var div_field = document.createElement('div');
    div_field.setAttribute('class', 'field');

    var label = document.createElement('label');
    label.setAttribute('for', 'register');

    var span = document.createElement('span');
    span.innerHTML = name;

    var input = document.createElement('input');
    input.setAttribute('Id', 'div_'+name);
    input.type = 'text';
    input.readonly = true;
    if ( match ) {
        input.value = match.value;
        input.ondblclick = function() { searchPDF(match.match);
        }
    }
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
