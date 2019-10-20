var express = require('express');
var app_uploader     = express();
var multer  = require('multer');

var storage = multer.diskStorage({
  // file upload destination
  destination: function (req, file, callback) {
    callback(null, './public/uploaded_pdfs/');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now() + '.pdf');
  }
});

var upload = multer( { storage : storage } ).any();

app_uploader.post('/pdf_upload',function( req, res ) {
    console.log('/pdf_upload called');
    upload( req, res, function(err) {
      // req.files is the `avatar` file
      // req.body will hold the text fields, if there were any
        if( err ) {
            return res.end( "Error uploading file." );
        }
        res.end( "File is uploaded" );
    });
});

app_uploader.use( express.static( 'public' ) );

app_uploader.listen(8080, function () {
  console.log('Example app_uploader listening on port 8080!');
});
