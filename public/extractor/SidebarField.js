class SidebarField {

    constructor( sidebar, field_id, display_name, display_position, validator_class ) {
        this.sidebar = sidebar; // parent instance
        this.field_id = field_id;
        this.display_name = display_name;
        this.value = '';
        this.match = '';
        this.input = null;
        this.display_position = display_position;
        this.settings = sidebar.settings;
        if ( display_name != null ) {
            try {
                const ValidatorClass = require( './' + validator_class + '.js' );
                this.validator = new ValidatorClass();
            } catch ( e ) {
                this.validator = null;
            }
        }
    }

    setValue( value ) {
        this.value = value;
        if ( this.input != null ) {
            this.input.value = value;
        }
    }

    setMatch( match ) {
        this.match = match;
    }

    // GUI methods
    getHtml() {
        let div_register = document.createElement( 'div' );
        div_register.setAttribute( 'class', 'register' );

        let div_field = document.createElement( 'div' );
        div_field.setAttribute( 'class', 'field' );

        let label = document.createElement( 'label' );
        label.setAttribute( 'for', 'register' );

        let span = document.createElement( 'span' );
        span.innerHTML = this.display_name;

        let input = document.createElement( 'input' );
        let inputname = 'input_' + this.field_id;
        input.setAttribute( 'Id', inputname );
        input.setAttribute( 'name', this.field_id );
        input.setAttribute( 'class', 'valid' );
        input.type = 'text';
        input.readonly = true;
        input.value = this.value;
        input.ondblclick = () => {
            FrontendController.searchPdf( this.match );
        };

        input.addEventListener( 'focus', function( e ) {
            focusedInput = e.target;
        } );
        const input_validation = ( e ) => {
            if ( this.validator ) {
                let rv = this.validator.validate( e.target.value, this.sidebar.frontendCntlr.suppliers_loader );
                e.target.value = rv.output;
                if ( rv.valid === false ) {
                    e.target.classList.remove( 'valid' );
                    e.target.classList.add( 'invalid' );
                } else {
                    e.target.classList.remove( 'invalid' );
                    e.target.classList.add( 'valid' );
                }
            }
        };
        // validate input on blur
        input.addEventListener( 'blur', input_validation );

        // validate input on ENTER keypress
        input.addEventListener( 'keypress', function( e ) {
            let keypress = e.which || e.keyCode;
            if ( keypress === 13 ) { // 13 is enter
                input_validation( e );
            }
        } );

        // Putting it all together
        label.appendChild( span );
        div_field.appendChild( label );
        div_field.appendChild( input );
        div_register.appendChild( div_field );
        this.input = input;
        return div_register;
    }
}

module.exports = SidebarField;
