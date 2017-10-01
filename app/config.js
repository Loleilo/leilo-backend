const perms = require('obj-perms-engine').NVEOPerms;
const version = require('../package.json').version;

module.exports = {
    serverID: "leilo", //username of server
    serverDefaultPassword: "pass", //default password given to server
    permsModule: perms, //permission module to use in obj system
    version: version, //gives program easy access to current package version
    saveLocation: `${__dirname}\\data\\state.json`, //where server state is stored on shutdown etc.
    saveInterval: -1,//amount of millis between autosave, -1 means don't autosave
    permsWildcard: '*', //wildcard indicator for perms/obj system
    pathMarker: 'path',//indicator of path in event array
    maxScriptTimeout: 1000, //maximum time a script instance can run synchronously for

    //forced global options for script sandboxes
    globalSandboxOptions: {
        allowRemoveAllListeners: false,
        forceSrc: true,
        forceDst: true,
    },

    //forced global options for script VMs
    globalVMOptions: {},

    //default value for max. number of listeners in event engine
    engineMaxListeners: 30,

    persist: false, //whether to save server changes

    debugLevel: "short", // can be none, short, normal, or verbose
};