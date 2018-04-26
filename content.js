
let {Constants} = require('./constants');
let {TrantorUtils} = require('./utils');
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
 * @param {Buffer} data
 * @return {ContentData}
 */
ContentData.deserialize = function(data) {
    let buffer = data;

    let type = parseInt(buffer.slice(2, 3).toString('hex'), 16);

    let contentData = null;
    switch (type) {
        case Constants.TYPE.CONTENT:
            contentData = new MediaData();
            break;
        case Constants.TYPE.USER:
            contentData = new Author();
            break;
        case Constants.TYPE.LIKE:
            contentData = new Like();
            break;
        case Constants.TYPE.UNLIKE:
            contentData = new Unlike();
            break;
        case Constants.TYPE.PAYMENT:
            contentData = new Payment();
            break;
        case Constants.TYPE.COMMENT:
            contentData = new Comment();
            break;
        case Constants.TYPE.DONATION:
            contentData = new Donation();
            break;
        case Constants.TYPE.FOLLOW:
            contentData = new Follow();
            break;
        case Constants.TYPE.UNFOLLOW:
            contentData = new Unfollow();
            break;
        case Constants.TYPE.BLOCK:
            contentData = new BlockContent();
            break;
        case Constants.TYPE.INDEX:
            contentData = new Index();
            break;
    }

    if (contentData) {
        contentData.deserialize(buffer, 0);
        return contentData;
    }

    return null;
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

TrantorUtils.inherit(Index, ContentData);

Index.prototype.serialize = function() {
    let bufferHex = TrantorUtils.serializeNumber(this.version);
    bufferHex += TrantorUtils.serializeNumber(this.type);

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

TrantorUtils.inherit(Author, ContentData);

/**
 *
 * @returns {Buffer}
 */
Author.prototype.serialize = function() {
    let bufferHex = TrantorUtils.serializeNumber(this.version);
    bufferHex += TrantorUtils.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.address).hash.toString('hex');

    bufferHex += TrantorUtils.serializeText(this.nick);
    bufferHex += TrantorUtils.serializeText(this.email);
    bufferHex += TrantorUtils.serializeText(this.web);
    bufferHex += TrantorUtils.serializeText(this.description);
    bufferHex += TrantorUtils.serializeText(this.avatar);
    let tags = JSON.stringify(this.tags);
    bufferHex += TrantorUtils.serializeText(tags);


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

    let desNick = TrantorUtils.deserializeText(buffer, offset);
    this.nick = desNick.text;
    offset += desNick.offset;

    let desEmail = TrantorUtils.deserializeText(buffer, offset);
    this.email = desEmail.text;
    offset += desEmail.offset;

    let desWeb = TrantorUtils.deserializeText(buffer, offset);
    this.web = desWeb.text;
    offset += desWeb.offset;

    let desDesc = TrantorUtils.deserializeText(buffer, offset);
    this.description = desDesc.text;
    offset += desDesc.offset;

    let desAva = TrantorUtils.deserializeText(buffer, offset);
    this.avatar = desAva.text;
    offset += desAva.offset;

    let desTags = TrantorUtils.deserializeText(buffer, offset);
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

TrantorUtils.inherit(MediaData, ContentData);

/**
 *
 * @returns {Buffer}
 */
MediaData.prototype.serialize = function() {
    let bufferHex = TrantorUtils.serializeNumber(this.version);
    bufferHex += TrantorUtils.serializeNumber(this.type);
    bufferHex += creativecoin.address.fromBase58Check(this.userAddress).hash.toString('hex');
    bufferHex += creativecoin.address.fromBase58Check(this.contentAddress).hash.toString('hex');
    bufferHex += TrantorUtils.serializeNumber(this.license);
    bufferHex += TrantorUtils.serializeText(this.title);
    bufferHex += TrantorUtils.serializeText(this.description);
    bufferHex += TrantorUtils.serializeText(this.contentType);
    let tags = JSON.stringify(this.tags);
    bufferHex += TrantorUtils.serializeText(tags);
    bufferHex += TrantorUtils.serializeNumber(this.price, 8);
    bufferHex += TrantorUtils.serializeText(this.publicContent);
    bufferHex += TrantorUtils.serializeText(this.privateContent);

    bufferHex += this.hash;
    bufferHex += TrantorUtils.serializeNumber(this.publicFileSize, 4);
    bufferHex += TrantorUtils.serializeNumber(this.privateFileSize, 4);

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

    let desTitle = TrantorUtils.deserializeText(buffer, offset);
    this.title = desTitle.text;
    offset += desTitle.offset;

    let desComment = TrantorUtils.deserializeText(buffer, offset);
    this.description = desComment.text;
    offset += desComment.offset;

    let destContentType = TrantorUtils.deserializeText(buffer, offset);
    this.contentType = destContentType.text;
    offset += destContentType.offset;

    let desTags = TrantorUtils.deserializeText(buffer, offset);
    this.tags = JSON.parse(desTags.text);
    offset += desTags.offset;

    this.price = parseInt(buffer.slice(offset, offset + 8).toString('hex'), 16);
    offset += 8;

    let publicContent = TrantorUtils.deserializeText(buffer, offset);
    this.publicContent = publicContent.text;
    offset += publicContent.offset;

    let privateContent = TrantorUtils.deserializeText(buffer, offset);
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


TrantorUtils.inherit(Like, ContentData);

/**
 *
 * @returns {Buffer}
 */
Like.prototype.serialize = function() {
    let bufferHex = TrantorUtils.serializeNumber(this.version);
    bufferHex += TrantorUtils.serializeNumber(this.type);
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

TrantorUtils.inherit(Unlike, ContentData);

/**
 *
 * @returns {Buffer}
 */
Unlike.prototype.serialize = function() {
    let bufferHex = TrantorUtils.serializeNumber(this.version);
    bufferHex += TrantorUtils.serializeNumber(this.type);
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

TrantorUtils.inherit(Payment, ContentData);

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

TrantorUtils.inherit(Comment, ContentData);

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

    let desComment = TrantorUtils.deserializeText(buffer, offset);
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

TrantorUtils.inherit(Donation, ContentData);

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


TrantorUtils.inherit(AddressRelation, ContentData);

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

TrantorUtils.inherit(Follow, AddressRelation);

/**
 *
 * @param {string} followerAddress
 * @param {string} followedAddress
 */
function Unfollow(followerAddress, followedAddress) {
    AddressRelation.call(this, Constants.TYPE.UNFOLLOW, followerAddress, followedAddress);
}

TrantorUtils.inherit(Unfollow, AddressRelation);

/**
 *
 * @param {string} followerAddress
 * @param {string} followedAddress
 */
function BlockContent(followerAddress, followedAddress) {
    AddressRelation.call(this, Constants.TYPE.BLOCK, followerAddress, followedAddress);
}

TrantorUtils.inherit(BlockContent, AddressRelation);

if (module) {
    module.exports = {
        ContentData, Index, Author, MediaData, Like, Unlike, Payment, Comment, Donation, AddressRelation, Follow,
        Unfollow, BlockContent
    }
}


