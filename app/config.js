const perms = require('obj-perms-engine').NVEOPerms;
const pjson = require('../package.json');

module.exports = {
    serverID: "leilo",
    serverDefaultPass: "pass",
    permsModule: perms,
    version: pjson.version,
    saveLocation: `${__dirname}\\data\\state.json`,
    saveInterval: -1,
};