/*
 * Functions to whitelist a string
 */
function removeChars( validChars, inputString, flags ) {
    var regex = new RegExp( '[^' + validChars + ']', flags );
    return inputString.replace( regex, '' );
}

module.exports = {
    removeChars
}
