const perms = require('obj-perms-engine').NVEOPerms;
const version = require('../package.json').version;
const match = require('./evtTablesMatch');

module.exports = {
    serverPort: 80,

    serverID: "leilo", //username of server

    defaultPasswordHashes: {
        leilo: {
            passwordHash: "sha1$37dea33b$1$0ca2d75849f2731a8248054702a5f4e7d00abc22"
        },
        // root: {
        //     passwordHash: "sha1$d403571a$1$3c5e41c8ce249b80d526ee9823dc4abc83509858"
        // },
    },

    version: version, //gives program easy access to current package version
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
    saveLocation: `${__dirname}\\data\\state.json`, //where server state is stored on shutdown etc.
    saveInterval: -1,//amount of millis between autosave, -1 means don't autosave
    persistVersionRequirements: ">=0.0.0",

    debugLevel: "none", // can be none, short, normal, or verbose

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

    exitDelay: 500, //amount to wait before exiting
};