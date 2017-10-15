const perms = require('obj-perms-engine').NVEOPerms;

module.exports = {
    serverID: "leilo", //username of server

    pathMarker: 'path',//indicator of path in event array

    permsEngineOptions: {
        USER_LEVEL: {
            ROOT: 0,
            USER: 1,
            PRGM: 2,
        },
        WILDCARD: '*',
        permsModule: perms,
    },
};