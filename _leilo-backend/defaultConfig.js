const match = require('../evtTablesMatch');

module.exports = {

    //server only config

    localConfig: {
        serverPort: 80,

        enable: "ALWAYS", //enable all modules by default

        defaultPasswordHashes: {
            leilo: {
                passwordHash: "sha1$37dea33b$1$0ca2d75849f2731a8248054702a5f4e7d00abc22"
            },
        },

        engine: {
            initState: {},
            wildcard: true, //enable wildcards in event name
            maxListeners: 30,
            defaultEvt: [undefined, '*', '*'],
            emitDefaultEvt: undefined,
        },

        exitDelay: 500, //amount to wait before exiting
    },

    //module configs

    moduleOrder: [
        "persist",
        "evtTables",
        "obj",
        "subscribe",
        "user",
        "scripts",
        "gc",
        "wsConnector",
        "debug",
    ],

    modules: {
        persist: {
            enable: "PRODUCTION",
            __moduleName: "persist",
            saveLocation: `${__dirname}\\data\\state.json`, //where server state is stored on shutdown etc.
            saveInterval: -1,//amount of millis between autosave, -1 means don't autosave
            persistVersionRequirements: ">=0.0.0",
        },

        evtTables: {
            __moduleName: "evtTables",
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
        },

        obj: {
            __moduleName: "obj",
        },

        subscribe: {
            __moduleName: "subscribe",
        },

        user: {
            __moduleName: {
                fileName: "user",
                funcName: "middleware",
            },
        },

        scripts: {
            __moduleName: "scripts",
            maxScriptTimeout: 1000, //maximum time a script instance can run synchronously for

            //forced global options for script sandboxes
            globalSandboxOptions: {
                allowRemoveAllListeners: false,
                forceSrc: true,
                forceDst: true,
            },

            //forced global options for script VMs
            globalVMOptions: {},
        },

        gc: {
            __moduleName: "gc",
        },

        wsConnector: {
            __moduleName: "wsConnector",
        },

        debug: {
            __moduleName: "debug",
            enable: "DEVELOPMENT",
            debugLevel: "normal", // can be none, short, normal, or verbose
        },
    },
};