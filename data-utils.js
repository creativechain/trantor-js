
let Buffer = require('safe-buffer').Buffer;
let varint = require('varint');

let DataUtils = {};

/**
 *
 * @param {number} number
 * @param {number} length
 * @return {string}
 */
DataUtils.serializeNumber = function (number, length) {
    let numberHex = number.toString(16);
    let pairChars = numberHex.length % 2 === 0;

    let neededChars;
    if (length) {
        neededChars = length * 2;
    } else {
        neededChars = pairChars ? numberHex.length : numberHex.length + 1;
    }

    let leadingZeros = neededChars - numberHex.length;

    for (let x = 0; x < leadingZeros; x++) {
        numberHex = '0' + numberHex;
    }
    return numberHex;
};

/**
 * @param {string} text
 */
DataUtils.serializeText = function(text) {
    if (text && text.length > 0) {
        let textHex = String.hexEncode(text);
        let textBuffer = Buffer.from(textHex, 'hex');

        return Buffer.from(varint.encode(textBuffer.length)).toString('hex') + textHex;
    } else {
        return Buffer.from(varint.encode(0)).toString('hex');
    }
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @return {{text: String, offset: Number|number}}
 */
DataUtils.deserializeText = function(buffer, offset) {
    let varInt = varint.decode(buffer, offset);
    offset += varint.decode.bytes;
    let textHex = buffer.slice(offset, offset + varInt).toString('hex');

    return {
        text: String.hexDecode(textHex),
        offset: varInt + varint.decode.bytes,
        offset2: offset + varInt
    }
};

if (module) {
    module.exports = {
        DataUtils: DataUtils
    }
}