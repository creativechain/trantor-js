
let Constants = {
    MAGIC_BYTE_TESTNET: 0xB8,
    MAGIC_BYTE: 0x51,
    VERSION: 0x0100, //Content version
    TYPE: {
        EMPTY: 0x00,
        CONTENT: 0x01,
        USER: 0x02,
        LIKE: 0x03,
        COMMENT: 0x04,
        DONATION: 0x05,
        FOLLOW: 0x06,
        UNFOLLOW: 0x07,
        INDEX: 0x08,
        UNLIKE: 0x09,
        PAYMENT: 0x10,
        BLOCK: 0x11,
        UNBLOCK: 0x12,
        OTHER: 0xFF,
    },
    LICENSE: {
        CC010: 0x00, //CC Public Domain
        PPBYNCSA: 0x01, //CC Peer Production. Attribution-NonCommercial-ShareAlike
        CCBYNCND40: 0x02, //CC Attribution-NonComercial-NoDerivs 4.0 International
        CCBYNCSA40: 0x03, //CC Attribution-NonCommercial-ShareAlike 4.0 International
        CCBYNC40: 0x04, //CC Attribution-NonComercial 4.0 International
        CCBYSA40: 0x05, //CC CC-BY-SA-4.0: Attribution-ShareAlike 4.0 International
        CCBYND40: 0x06, //CC CC-BY-ND-4.0: Attribution-NoDerivs 4.0 International
        CCBY40: 0x07, //CC Attribution 4.0 international
    }
};

if (module) {
    module.exports = {
        Constants: Constants
    };
}
