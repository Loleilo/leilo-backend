const config = require('./config');
const Sandbox = require("./sandbox.js").Sandbox;
const d = require('./util').getDefault;
const serverID = config.serverID;
const {VM} = require('vm2');
const uuid4 = require('uuid/v4');

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        //make sure list of scripts is existing
        state.instantiatedScripts = d(state.instantiatedScripts, {});

        next(state);
    });

    //runs a script instance
    on(['script_start', '*', serverID], (state, next, payload, engine) => {
        const scriptInstanceID = payload.scriptInstanceID;
        const info = state.instantiatedScripts[scriptInstanceID];

        //create script environment
        const sandbox = new Sandbox(engine, scriptInstanceID,
            Object.assign({},
                info.sandboxOptions,
                config.globalSandboxOptions));

        const vm = new VM(Object.assign({},
            payload.vmOptions,
            {
                timeout: Math.min(config.maxScriptTimeout,
                    d(info.scriptTimeout, config.maxScriptTimeout)), //todo timeout for async code?
                sandbox: sandbox.interface
            },
            config.globalVMOptions));

        let code;
        if (info.runFromPath)
            code = state.read(info.parentID, state, info.scriptPath);
        else
            code = info.scriptCode;

        vm.run(code);

        if (info.firstRun)
            engine.emit(['init_run', info.parentID, scriptInstanceID]);

        next(state);
    });

    //creates a script instance
    on(['instantiate_script', '*', serverID], (state, next, payload, engine, evt) => {
        console.log("wut");
        const scriptInstanceID = uuid4();//give script new id

        //give script a user level
        state.updateUserLevel(serverID, state, scriptInstanceID, 2);//todo replace 2 with constants

        //store script info
        state.instantiatedScripts[scriptInstanceID] = Object.assign(payload, {
            parentID: evt.src,
            firstRun: true
        });

        console.log('runnning script');
        //run script
        engine.emit(['script_start', evt.src, serverID], {
            scriptInstanceID: scriptInstanceID,
        });

        //send new script id back to user
        engine.emit(['script_instantiated', serverID, evt.src], {
            scriptInstanceID: scriptInstanceID,
        });

        next(state);
    });
};