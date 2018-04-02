
let {Constants} = require('./constants');
let {DataUtils} = require('./data-utils');
let {TrantorNetwork} = require('./network');
let Buffer = require('safe-buffer').Buffer;
let varint = require('varint');
const creativecoin = require('bitcoinjs-lib');

/**
 * 
 * @param {Number} version
 * @param {Number} type
 * @constructor
 */
function ContentData (version, type) {
    this.version = version;
    this.type = type;
    this.mustBeCompressed = 0;
}

/**
 * @return {Buffer}
 */
ContentData.prototype.serialize = function () {
    throw Error('Method Not Supported');
};

/**
 * @return {Number}
 */
ContentData.prototype.size = function () {
    return this.serialize().length;
};

ContentData.prototype.setCompression = function() {
    this.mustBeCompressed = 0;
    let length = this.size();
    this.mustBeCompressed = length >= 160 ? 1 : 0;
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
ContentData.prototype.__deserialize = function(buffer, offset) {
    this.version = buffer.readUInt16BE(offset);
    offset += 2;
    this.type = buffer.readInt8(offset);
    offset +=1;
    return offset;
};

/**
 *
 * @type {TrantorNetwork}
 */
ContentData.NETWORK = TrantorNetwork.MAINNET;

/**
 *
 * @param {Array} txIds
 */
function Index(txIds) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.INDEX);
    this.txIds = txIds;
}

Index.prototype.serialize = function() {
    let bufferHex = DataUtils.serializeNumber(this.version);
    bufferHex += DataUtils.serializeNumber(this.type);

    bufferHex += Buffer.from(varint.encode(this.txIds.length)).toString('hex');

    this.txIds.forEach(function (txId) {
        let buff = Buffer.from(txId, 'hex');
        if (buff.length !== 32) {
            throw 'Invalid txId: ' + txId;
        }

        bufferHex += buff.toString('hex');
    });

    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {Number} offset
 * @return {*}
 */
Index.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);

    let varInt = varint.decode(buffer, offset);
    offset += varint.decode.bytes;

    this.txIds = [];
    for (let x = 0; x < varInt.value; x++) {
        let tx = buffer.slice(offset, offset+32);
        offset += 32;
        this.txIds.push(tx.toString('hex'));
    }

    return offset;
};

/**
 *
 * @param {string} address
 * @param {string} nick
 * @param {string} email
 * @param {string} web
 * @param {string} description
 * @param {string} avatar
 * @param {Array} tags
 */
function Author(address, nick, email, web, description, avatar, tags) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.USER);
    this.address = address;
    this.nick = nick;
    this.email = email;
    this.web = web;
    this.description = description;
    this.avatar = avatar;
    this.tags = tags ? tags : [];
}

/**
 *
 * @returns {Buffer}
 */
Author.prototype.serialize = function() {
    let bufferHex = DataUtils.serializeNumber(this.version);
    bufferHex += DataUtils.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.address).hash.toString('hex');

    bufferHex += DataUtils.serializeText(this.nick);
    bufferHex += DataUtils.serializeText(this.email);
    bufferHex += DataUtils.serializeText(this.web);
    bufferHex += DataUtils.serializeText(this.description);
    bufferHex += DataUtils.serializeText(this.avatar);
    let tags = JSON.stringify(this.tags);
    bufferHex += DataUtils.serializeText(tags);


    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
Author.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.address = buffer.slice(offset, offset + 20);

    this.address = creativecoin.address.toBase58Check(this.address, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    let desNick = DataUtils.deserializeText(buffer, offset);
    this.nick = desNick.text;
    offset += desNick.offset;

    let desEmail = DataUtils.deserializeText(buffer, offset);
    this.email = desEmail.text;
    offset += desEmail.offset;

    let desWeb = DataUtils.deserializeText(buffer, offset);
    this.web = desWeb.text;
    offset += desWeb.offset;

    let desDesc = DataUtils.deserializeText(buffer, offset);
    this.description = desDesc.text;
    offset += desDesc.offset;

    let desAva = DataUtils.deserializeText(buffer, offset);
    this.avatar = desAva.text;
    offset += desAva.offset;

    let desTags = DataUtils.deserializeText(buffer, offset);
    this.tags = JSON.parse(desTags.text);
    offset += desTags.offset;
    return offset;
};

/**
 *
 * @param {string} title
 * @param {string} description
 * @param {string} contentType
 * @param {number} license
 * @param {string} userAddress
 * @param {string} contentAddress
 * @param {Array} tags
 * @param {number} price
 * @param {string} publicContent
 * @param {string} privateContent
 * @param {string} hash
 * @param {number} publicFileSize
 * @param {number} privateFileSize
 */
function MediaData(title, description, contentType, license, userAddress, contentAddress, tags, price, publicContent, privateContent, hash, publicFileSize, privateFileSize) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.CONTENT);
    this.userAddress = userAddress;
    this.contentAddress = contentAddress;
    this.license = license;
    this.title = title;
    this.description = description;
    this.contentType = contentType;
    this.tags = tags ? tags : [];
    this.price = price ? price : 0;
    this.publicContent = publicContent;
    this.privateContent = privateContent;
    this.hash = hash;
    this.publicFileSize = publicFileSize ? publicFileSize : 0;
    this.privateFileSize = privateFileSize ? privateFileSize : 0;
}

/**
 *
 * @returns {Buffer}
 */
MediaData.prototype.serialize = function() {
    let bufferHex = DataUtils.serializeNumber(this.version);
    bufferHex += DataUtils.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.userAddress).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.contentAddress).hash.toString('hex');
    bufferHex += DataUtils.serializeNumber(this.license);
    bufferHex += DataUtils.serializeText(this.title);
    bufferHex += DataUtils.serializeText(this.description);
    bufferHex += DataUtils.serializeText(this.contentType);
    let tags = JSON.stringify(this.tags);
    bufferHex += DataUtils.serializeText(tags);
    bufferHex += DataUtils.serializeNumber(this.price, 8);
    bufferHex += DataUtils.serializeText(this.publicContent);
    bufferHex += DataUtils.serializeText(this.privateContent);

    bufferHex += this.hash;
    bufferHex += DataUtils.serializeNumber(this.publicFileSize, 4);
    bufferHex += DataUtils.serializeNumber(this.privateFileSize, 4);

    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
MediaData.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.userAddress = buffer.slice(offset, offset + 20);
    this.userAddress = creativecoin.address.toBase58Check(this.userAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.contentAddress = buffer.slice(offset, offset + 20);
    this.contentAddress = creativecoin.address.toBase58Check(this.contentAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.license = buffer[offset];
    offset += 1;

    let desTitle = DataUtils.deserializeText(buffer, offset);
    this.title = desTitle.text;
    offset += desTitle.offset;

    let desComment = DataUtils.deserializeText(buffer, offset);
    this.description = desComment.text;
    offset += desComment.offset;

    let destContentType = DataUtils.deserializeText(buffer, offset);
    this.contentType = destContentType.text;
    offset += destContentType.offset;

    let desTags = DataUtils.deserializeText(buffer, offset);
    this.tags = JSON.parse(desTags.text);
    offset += desTags.offset;

    this.price = parseInt(buffer.slice(offset, offset + 8).toString('hex'), 16);
    offset += 8;

    let publicContent = DataUtils.deserializeText(buffer, offset);
    this.publicContent = publicContent.text;
    offset += publicContent.offset;

    let privateContent = DataUtils.deserializeText(buffer, offset);
    this.privateContent = privateContent.text;
    offset += privateContent.offset;

    this.hash = buffer.slice(offset, offset + 32).toString('hex');
    offset += 32;

    this.publicFileSize = parseInt(buffer.slice(offset, offset + 4).toString('hex'), 16);
    offset += 4;

    this.privateFileSize = parseInt(buffer.slice(offset, offset + 4).toString('hex'), 16);
    offset += 4;

    return offset;
};

/**
 *
 * @param {string} author
 * @param {string} contentAddress
 */
function Like(author, contentAddress) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.LIKE);
    this.author = author;
    this.contentAddress = contentAddress;
}

/**
 *
 * @returns {Buffer}
 */
Like.prototype.serialize = function() {
    let bufferHex = DataUtils.serializeNumber(this.version);
    bufferHex += DataUtils.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.author).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.contentAddress).hash.toString('hex');
    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
Like.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.author = buffer.slice(offset, offset + 20);
    this.author =  creativecoin.address.toBase58Check(this.author, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.contentAddress = buffer.slice(offset, offset + 20);
    this.contentAddress =  creativecoin.address.toBase58Check(this.contentAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;
    return offset;
};

/**
 *
 * @param {string} author
 * @param {string} contentAddress
 */
function Unlike(author, contentAddress) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.UNLIKE);
    this.author = author;
    this.contentAddress = contentAddress;
}

/**
 *
 * @returns {Buffer}
 */
Unlike.prototype.serialize = function() {
    let bufferHex = DataUtils.serializeNumber(this.version);
    bufferHex += DataUtils.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.author).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.contentAddress).hash.toString('hex');
    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
Unlike.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.author = buffer.slice(offset, offset + 20);
    this.author =  creativecoin.address.toBase58Check(this.author, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.contentAddress = buffer.slice(offset, offset + 20);
    this.contentAddress =  creativecoin.address.toBase58Check(this.contentAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;
    return offset;
};

/**
 *
 * @param {string} author
 * @param {string} contentAddress
 * @param {number} amount
 */
function Payment(author, contentAddress, amount) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.PAYMENT);
    this.author = author;
    this.contentAddress = contentAddress;
    this.amount = amount;
}

/**
 *
 * @returns {Buffer}
 */
Payment.prototype.serialize = function() {
    let bufferHex = ContentData.serializeNumber(this.version);
    bufferHex += ContentData.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.author).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.contentAddress).hash.toString('hex');
    bufferHex += ContentData.serializeNumber(this.amount, 8);
    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
Payment.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.author = buffer.slice(offset, offset + 20);
    this.author =  creativecoin.address.toBase58Check(this.author, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.contentAddress = buffer.slice(offset, offset + 20);
    this.contentAddress =  creativecoin.address.toBase58Check(this.contentAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.amount = parseInt(buffer.slice(offset, offset + 8).toString('hex'), 16);
    offset += 8;
    return offset;
};

/**
 *
 * @param {string} author
 * @param {string} contentAddress
 * @param {string} comment
 */
function Comment(author, contentAddress, comment) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.COMMENT);
    this.author = author;
    this.contentAddress = contentAddress;
    this.comment = comment;
}

/**
 *
 * @returns {Buffer}
 */
Comment.prototype.serialize = function() {
    let bufferHex = ContentData.serializeNumber(this.version);
    bufferHex += ContentData.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.author).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.contentAddress).hash.toString('hex');
    bufferHex += ContentData.serializeText(this.comment);
    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
Comment.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.author = buffer.slice(offset, offset + 20);
    this.author =  creativecoin.address.toBase58Check(this.author, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.contentAddress = buffer.slice(offset, offset + 20);
    this.contentAddress =  creativecoin.address.toBase58Check(this.contentAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    let desComment = ContentData.deserializeText(buffer, offset);
    this.comment = desComment.text;
    offset += desComment.offset;
    return offset;
};

/**
 *
 * @param {string} author
 */
function Donation(author) {
    ContentData.call(this, Constants.VERSION, Constants.TYPE.DONATION);
    this.author = author;
}

/**
 *
 * @returns {Buffer}
 */
Donation.prototype.serialize = function() {
    let bufferHex = ContentData.serializeNumber(this.version);
    bufferHex += ContentData.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.author).hash.toString('hex');
    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
Donation.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.author = buffer.slice(offset, offset + 20);
    this.author =  creativecoin.address.toBase58Check(this.author, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    return offset;
};

/**
 *
 * @param {number} type
 * @param {string} activeAddress
 * @param {string} pasiveAddress
 */
function AddressRelation(type, activeAddress, pasiveAddress) {
    ContentData.call(this, Constants.VERSION, type);
    this.followerAddress = activeAddress;
    this.followedAddress = pasiveAddress;
}

/**
 *
 * @returns {Buffer}
 */
AddressRelation.prototype.serialize = function() {
    let bufferHex = ContentData.serializeNumber(this.version);
    bufferHex += ContentData.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.followerAddress).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.followedAddress).hash.toString('hex');
    return Buffer.from(bufferHex, 'hex');
};

/**
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @returns {number}
 */
AddressRelation.prototype.deserialize = function(buffer, offset) {
    offset = this.__deserialize(buffer, offset);
    this.followerAddress = buffer.slice(offset, offset + 20);
    this.followerAddress =  creativecoin.address.toBase58Check(this.followerAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;

    this.followedAddress = buffer.slice(offset, offset + 20);
    this.followedAddress =  creativecoin.address.toBase58Check(this.followedAddress, ContentData.NETWORK.pubKeyHash);
    offset += 20;
    return offset;
};

/**
 *
 * @param {string} followerAddress
 * @param {string} followedAddress
 */
function Follow(followerAddress, followedAddress) {
    AddressRelation.call(this, Constants.TYPE.FOLLOW, followerAddress, followedAddress);
}

/**
 *
 * @param {string} followerAddress
 * @param {string} followedAddress
 */
function Unfollow(followerAddress, followedAddress) {
    AddressRelation.call(this, Constants.TYPE.UNFOLLOW, followerAddress, followedAddress);
}

/**
 *
 * @param {string} followerAddress
 * @param {string} followedAddress
 */
function BlockContent(followerAddress, followedAddress) {
    AddressRelation.call(this, Constants.TYPE.BLOCK, followerAddress, followedAddress);
}

if (module) {
    module.exports = {
        ContentData: ContentData,
        Index: Index,
        Author: Author,
        MediaData: MediaData,
        Like: Like,
        Unlike: Unlike,
        Payment: Payment,
        Comment: Comment,
        Donation: Donation,
        AddressRelation: AddressRelation,
        Follow: Follow,
        Unfollow: Unfollow,
        BlockContent: BlockContent
    }
}


