let {Constants} = require('./constants');

function TrantorNetwork (messagePrefix, bip32, pubKeyHash, scriptHash, wif, trantorMagicByte) {
    this.messagePrefix = messagePrefix;
    this.bip32 = bip32;
    this.pubKeyHash = pubKeyHash;
    this.scriptHash = scriptHash;
    this.wif = wif;
    this.trantorMagicByte = trantorMagicByte
}

TrantorNetwork.MAINNET = new TrantorNetwork('\x18Creativecoin Signed Message:\n', {
    public: 0x0488b21e,
    private: 0x0488ade4
}, 0x1c, 0x05, 0xb0, Constants.MAGIC_BYTE);

TrantorNetwork.TESTNET = new TrantorNetwork('\x18Creativecoin Signed Message:\n', {
    public: 0x043587cf,
    private: 0x04358394
}, 0x57, 0xc4, 0xef, Constants.MAGIC_BYTE_TESTNET);

if (module) {
    module.exports = {
        TrantorNetwork: TrantorNetwork
    };
}
