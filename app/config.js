const perms = require('obj-perms-engine').CRUDPerms;
const version = require('../package.json').version;

module.exports = {
    serverID: "leilo",
    serverDefaultPass: "pass",
    permsModule: perms,
    version: version,
    saveLocation: `${__dirname}\\data\\state.json`,
    saveInterval: -1,
    permsWildcard: '*',
};