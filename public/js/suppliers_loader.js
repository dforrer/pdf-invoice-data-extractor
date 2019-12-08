// Requirements
const fs       = require('fs');
const readline = require('readline');

// Global variables
const suppliers = [];

/**
 * Constructs a Supplier-object
 * @constructor
 * @param {object} attr - object containing the attributes of a single supplier
 */

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

/**
 * Loads the list of suppliers from a CSV file and adds them to the suppliers array
 * @param {string} csvPath - path to a csv file semicolon delimited
 * @param {callback} cb
 */

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
        suppliers.push(supplier);
    });

    rl.on( 'close', function () {
        cb();
    });
}

/**
 * Get function to retrieve single supplier from suppliers array based on IBAN
 * @param {string} iban
 * @returns {Supplier}
 */

function getSupplierForIban ( iban ) {
    for ( var i = 0 ; i < suppliers.length ; i++ ) {
        if ( suppliers[i].iban == iban ) {
            return suppliers[i];
        }
    }
    return 0;
}

/**
 * Get function to retrieve single supplier from suppliers array based on UID
 * @param {string} uid
 * @returns {Supplier}
 */

function getSupplierForUid ( uid ) {
    for ( var i = 0 ; i < suppliers.length ; i++ ) {
        if ( suppliers[i].uid == uid ) {
            return suppliers[i];
        }
    }
    return 0;
}

/**
 * Get function to retrieve single supplier from suppliers array based on creditor ID
 * @param {string} id
 * @returns {Supplier}
 */

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
