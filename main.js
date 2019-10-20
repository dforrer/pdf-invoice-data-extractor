// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    minWidth: 1100,
    minHeight: 1000,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      nodeIntegration: true  // needed for require to work on the client side
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('public/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// Queue Implementation
function Queue() {
    this.data = [];
}
Queue.prototype.add = function(record) {
    this.data.unshift(record);
}
Queue.prototype.remove = function() {
    this.data.pop();
}
Queue.prototype.first = function() {
    return this.data[0];
}
Queue.prototype.last = function() {
    return this.data[this.data.length - 1];
}
Queue.prototype.size = function() {
    return this.data.length;
}

// Requirements
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {};
const parser = require('./parser.js');
const exec = require("child_process").exec;

// Constants
const ocrmypdf = false;
const q = new Queue();
var running_jobs_count = 0;

// In main process.
ipcMain.on( 'extract-data-from-pdf', (event, arg) => {
    //console.log( event );
    q.add( {"event":event, "pdf":arg } );
    schedule_job();
});

function schedule_job() {
    if ( q.size() == 0 || running_jobs_count > 1 ) {
        return;
    }
    running_jobs_count += 1;
    var nextEl = q.last();
    q.remove();
    if ( ocrmypdf ) {
        const cmd = 'ocrmypdf -l deu --force-ocr "' + nextEl.pdf.filepath + '" "' + nextEl.pdf.filepath + '"';
        exec( cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            extract_pdf( nextEl );
        });
    } else {
        extract_pdf( nextEl );
    }
}

function extract_pdf ( nextEl ) {
    pdfExtract.extract( nextEl.pdf.filepath, options, (err, data) => {
        if (err) return console.log(err);
        parser.parseJsonAndExport( data,
            function(rv) {
                nextEl.pdf.extracted_data = rv;
                nextEl.event.reply('data-extraction-done', nextEl.pdf);
                running_jobs_count -= 1;
                schedule_job();
            }
        );
    });
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  if (process.mas) return

  app.requestSingleInstanceLock()

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

makeSingleInstance();

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//require('./app.js');
