const perms = require('obj-perms-engine').NVEOPerms;
const version = require('../package.json').version;

module.exports = {
    serverID: "leilo",
    serverDefaultPass: "pass",
    permsModule: perms,
    version: version,
    saveLocation: `${__dirname}\\data\\state.json`,
    saveInterval: -1,
    permsWildcard: '*',
    pathMarker: 'path',
    maxScriptTimeout: 1000,
    globalSandboxOptions: {
        allowRemoveAllListeners: false,
        forceSrc: true,
        forceDst: true,
    },
    globalVMOptions:{
    },
};