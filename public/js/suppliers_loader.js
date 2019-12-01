// Requirements
const fs   = require('fs');
const readline = require('readline');
const suppliers = [];

// Constructors
function Supplier ( attr ) {
    this.id = attr['Kreditor'];
    this.name1 = attr['Name 1'];
    this.name2 = attr['Name 2'];
    this.street = attr['Straße'];
    this.postcode = attr['Postleitz.'];
    this.town = attr['Ort'];
    this.country = attr['Land'];
    this.iban = attr['IBAN'];
    this.uid = attr['Steuernummer 1'];
    if ( attr['Zentrale Buchungssperre'] == 'nein' ) {
        this.posting_block = false;
    } else {
        this.posting_block = true;
    }
}

// Main function
function loadSuppliers ( csvPath, cb ) {
    // Load CSV creditor list
    var lineCounter = 0;
    var csvHeader   = [];

    const rl = readline.createInterface({
        input: fs.createReadStream( csvPath ),
        crlfDelay: Infinity
    });

    rl.on( 'line', (line) => {
        lineCounter++;
        var entry = line.split(';');
        if (lineCounter == 1) {
            csvHeader = entry;
        }
        var s = {};
        for (var i = 0; i < csvHeader.length; i++) {
            s[csvHeader[i]] = entry[i];
        }
        var supplier = new Supplier(s);
        // if (lineCounter < 5) {
        //     console.log(s);
        //     console.log(supplier);
        // }
        suppliers.push(supplier);
    });

    rl.on( 'close', function () {
        cb();
    });
}

function getSupplierForIban ( iban ) {
    for ( var i = 0 ; i < suppliers.length ; i++ ) {
        if ( suppliers[i].iban == iban ) {
            return suppliers[i];
        }
    }
    return 0;
}

function getSupplierForUid ( uid ) {
    for ( var i = 0 ; i < suppliers.length ; i++ ) {
        if ( suppliers[i].uid == uid ) {
            return suppliers[i];
        }
    }
    return 0;
}

function getSupplierForId ( id ) {
    for ( var i = 0 ; i < suppliers.length ; i++ ) {
        if ( suppliers[i].id == id ) {
            return suppliers[i];
        }
    }
    return 0;
}

// Node.js module exports
module.exports = {
    loadSuppliers,
    getSupplierForIban,
    getSupplierForUid,
    getSupplierForId
}