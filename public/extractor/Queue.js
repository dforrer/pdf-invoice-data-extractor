class Queue {

    constructor() {
        this.items = [];
        this.index = 0;
    }

    append( item ) {
        this.items.push( item );
    }

    removeAtIndex() {
        if ( this.items.length === 0 ) return undefined;
        let item = this.items.splice( this.index, 1 );
        return item[ 0 ];
    }

    clear() {
        this.items = [];
        this.index = 0;
    }

    previous() {
        this.index--;
        if ( this.index < 0 ) {
            this.index = this.items.length - 1;
        }
        return this.items[ this.index ];
    }

    current() {
        return this.items[ this.index ];
    }

    next() {
        this.index++;
        this.index = this.index % this.items.length;
        return this.items[ this.index ];
    }

    size() {
        return this.items.length;
    }

    getIndex() {
        return this.index;
    }
}

module.exports = Queue;
