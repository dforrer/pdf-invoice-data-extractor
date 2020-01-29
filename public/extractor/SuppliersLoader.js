// Requirements
const fs = require( 'fs' );
const readline = require( 'readline' );

/**
 * Constructs a Supplier-object
 * @class
 */

class Supplier {
    /**
     * @param {object} attr - object containing the attributes of a single supplier
     */
    constructor( attr ) {
        this.id = attr[ 'Creditor' ];
        this.name1 = attr[ 'Name 1' ];
        this.name2 = attr[ 'Name 2' ];
        this.street = attr[ 'Street' ];
        this.postcode = attr[ 'Postcode' ];
        this.town = attr[ 'Town' ];
        this.country = attr[ 'Country' ];
        this.iban = attr[ 'IBAN' ];
        this.vat_number = attr[ 'Vat Number' ];
        if ( attr[ 'Posting Block' ] == 'no' ) {
            this.posting_block = false;
        } else {
            this.posting_block = true;
        }
    }
}

class SuppliersLoader {

    constructor() {
        this.suppliers = [];
    }

    /**
     * Loads the list of suppliers from a CSV file and adds them to the suppliers array
     * @param {string} csvPath - path to a csv file semicolon delimited
     * @param {callback} cb
     */

    loadFromCsv( csvPath, cb ) {
        // Load CSV creditor list
        let lineCounter = 0;
        let csvHeader = [];

        const rl = readline.createInterface( {
            input: fs.createReadStream( csvPath ),
            crlfDelay: Infinity
        } );

        rl.on( 'line', ( line ) => {
            lineCounter++;
            let entry = line.split( ';' );
            if ( lineCounter == 1 ) {
                csvHeader = entry;
            }
            let s = {};
            for ( let i = 0; i < csvHeader.length; i++ ) {
                s[ csvHeader[ i ] ] = entry[ i ];
            }
            let supplier = new Supplier( s );
            this.suppliers.push( supplier );
        } );

        rl.on( 'close', function() {
            cb();
        } );
    }

    /**
     * Get function to retrieve single supplier from suppliers array based on IBAN
     * @param {string} iban
     * @returns {Supplier}
     */

    getSupplierForIban( iban ) {
        for ( let i = 0; i < this.suppliers.length; i++ ) {
            if ( this.suppliers[ i ].iban == iban ) {
                return this.suppliers[ i ];
            }
        }
        return 0;
    }

    /**
     * Get function to retrieve single supplier from suppliers array based on vat number
     * @param {string} vat_number
     * @returns {Supplier}
     */

    getSupplierForVatNumber( vat_number ) {
        for ( let i = 0; i < this.suppliers.length; i++ ) {
            if ( this.suppliers[ i ].vat_number == vat_number ) {
                return this.suppliers[ i ];
            }
        }
        return 0;
    }

    /**
     * Get function to retrieve single supplier from suppliers array based on creditor ID
     * @param {string} id
     * @returns {Supplier}
     */

    getSupplierForId( id ) {
        for ( let i = 0; i < this.suppliers.length; i++ ) {
            if ( this.suppliers[ i ].id == id ) {
                return this.suppliers[ i ];
            }
        }
        return 0;
    }
}

module.exports = SuppliersLoader;
