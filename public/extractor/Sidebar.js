const SidebarField = require( '../extractor/SidebarField.js' );

class Sidebar {

    constructor( frontendCntlr ) {
        this.frontendCntlr = frontendCntlr; // parent instance
        this.fields = []; // array of SidebarField objects
        this.settings = frontendCntlr.settings;
        this.sidebar_config = require( this.settings.sidebar_config );
    }

    addFieldsFromConfig() {
        let sidebar_fields = this.sidebar_config.extractor_container_fields;
        for ( let f of sidebar_fields ) {
            let sidebar_field = new SidebarField( this, f.field_id, f.display_name, f.display_position, f.validator_class );
            this.fields.push( sidebar_field );
        }
        // sort based on display_position field
        this.fields = this.fields.sort( function( a, b ) {
            return a.display_position - b.display_position;
        } );
    }

    setButtonTitles() {
        let export_pdf_data = document.getElementById( 'export_pdf_data' );
        let delete_pdf = document.getElementById( 'delete_pdf' );
        let pdf_drop_area = document.getElementById( 'pdf_drop_area' );
        export_pdf_data.innerHTML = this.sidebar_config.export_pdf_data_button;
        delete_pdf.innerHTML = this.sidebar_config.delete_pdf_button;
        pdf_drop_area.innerHTML = this.sidebar_config.pdf_drop_area;
    }

    registerLongPressHandler() {
        const $this = this;
        console.log( 'registerLongPressHandler' );
        let delete_pdf = document.getElementById( 'delete_pdf' );
        let pressTimer;
        delete_pdf.addEventListener( 'mouseup', function( e ) {
            clearTimeout( pressTimer );
            return false;
        } );
        delete_pdf.addEventListener( 'mousedown', function( e ) {
            pressTimer = window.setTimeout( function() {
                console.log( 'Delete Button: long press' );
                if ( confirm( 'Clear PDF queue?' ) ) {
                    $this.frontendCntlr.clearPdfQueue();
                }
            }, 1000 );
            return false;
        } );
    }

    renderSidebarFields() {
        let extractorContainer = document.getElementById( 'extracted_data' );
        for ( let f of this.fields ) {
            if ( f.display_name != null ) {
                let html = f.getHtml();
                extractorContainer.appendChild( html );
            }
        }
    }

    // refactored - GUI
    clear() {
        for ( let f of this.fields ) {
            f.setValue( '' );
            f.setMatch( '' );
        }
    }

    updateButtonLoadNextPdf() {
        let el = document.getElementById( 'current_pdf' );
        if ( pdf_queue.length > 0 ) {
            el.innerHTML = ( pdf_queue_index + 1 ) + "/" + pdf_queue.length;
        } else {
            el.innerHTML = "0/0";
        }
    }

    // refactored - Model
    collectFieldValues() {
        let validated_data = {};
        for ( let f of this.fields ) {
            validated_data[ f.field_id ] = f.value;
        }
        return validated_data;
    }

    // refactored - GUI
    fill( extracted_data ) {
        this.clear();
        for ( let f of this.fields ) {
            let first_value = extracted_data[ f.field_id ][ 0 ];
            if ( first_value ) {
                f.setValue( first_value.value );
                f.setMatch( first_value.match );
            }
        }
    }
}

module.exports = Sidebar;
