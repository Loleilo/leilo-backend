const config = require('./config');
const Sandbox = require("./sandbox.js").Sandbox;
const d = require('./util').getDefault;
const serverID = config.serverID;
const {VM} = require('vm2');
const uuid4 = require('uuid/v4');

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next, payload, engine) => {
        //make sure list of scripts is existing
        state.instantiatedScripts = d(state.instantiatedScripts, {});

        //auto run scripts
        for (const script in state.instantiatedScripts) {
            if (!state.instantiatedScripts.hasOwnProperty(script)) continue;
            state.instantiatedScripts[script].running = false;
            engine.emit(['script_start', serverID, serverID], {
                scriptInstanceID: script
            });
        }

        next(state);
    });

    //runs a script instance
    on(['script_start', '*', serverID], (state, next, payload, engine, evt) => {
        const scriptInstanceID = payload.scriptInstanceID;
        const info = state.instantiatedScripts[scriptInstanceID];

        //prevent script from running twice
        if (info.running) {
            engine.emit(['error_occurred', serverID, evt.src], {
                err: new Error('Script instance is already running')
            });
            next(state);
        }
        state.instantiatedScripts[scriptInstanceID].running = true;

        //create script sandbox
        const sandbox = new Sandbox(engine, scriptInstanceID,
            Object.assign({}, //base object
                info.sandboxOptions, //user given options
                config.globalSandboxOptions)); //global options

        //create script vm to run script in
        const vm = new VM(Object.assign({},
            payload.vmOptions, //user given options
            {
                //timeout allowed for script
                timeout: Math.min(config.maxScriptTimeout, d(info.scriptTimeout, config.maxScriptTimeout)),
                sandbox: sandbox.interface //give actual sandbox
            },
            config.globalVMOptions));

        //setup event for script to request an evt to be send as parent user
        engine.on(['request_elevated', scriptInstanceID, serverID], (payload) => {
            //pipe event to user (event is not directly sent for security reasons)
            engine.emit(['request_elevated', scriptInstanceID, info.parentID], payload);
        });

        //choose which code to run
        let code;
        if (info.runFromPath)
            code = state.read(info.parentID, state, info.scriptPath);
        else
            code = info.scriptCode;

        vm.run(code); //actually run code

        //if first run of script, call script init func
        if (info.needInit) {
            // script should emit init_done when setup is done
            engine.once(['init_done', scriptInstanceID, serverID], () => {
                state.instantiatedScripts[scriptInstanceID].needInit = false;
            });
            engine.emit(['init_run', serverID, scriptInstanceID]);
        }

        next(state);
    });

    //creates a script instance
    on(['instantiate_script', '*', serverID], (state, next, payload, engine, evt) => {
        const scriptInstanceID = uuid4();//give script new id

        //give script a user level
        state.updateUserLevel(serverID, state, scriptInstanceID, 2);//todo replace 2 with constants

        //store script info
        state.instantiatedScripts[scriptInstanceID] = Object.assign(payload, {
            parentID: evt.src,
            needInit: true,
        });

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