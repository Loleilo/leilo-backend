const perms = require('obj-perms-engine').NVEOPerms;
const version = require('../package.json').version;
const match = require('./evtTablesMatch');

module.exports = {
    serverID: "leilo", //username of server
    serverDefaultPassword: "pass", //default password given to server
    version: version, //gives program easy access to current package version
    saveLocation: `${__dirname}\\data\\state.json`, //where server state is stored on shutdown etc.
    saveInterval: -1,//amount of millis between autosave, -1 means don't autosave
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

    persist: true, //whether to save server changes (make sure to set to false on debug)

    debugLevel: "normal", // can be none, short, normal, or verbose

    permsEngineOptions: {
        USER_LEVEL: {
            ROOT: 0,
            USER: 1,
            PRGM: 2,
        },
        WILDCARD: '*',
        permsModule: perms,
    },

    defaultEvtRules: [
        { //accept all root events
            action: 'accept',
            match: match.userLevel(match.ALL, 0)
        },
        //accept all non handled events
        {
            action: 'accept',
            match: match.ALL,
        },
    ],

    exitDelay: 200, //amount to wait before exiting
};