const config = require('./config');
const Sandbox = require("./sandbox.js").Sandbox;
const d = require('./util').getDefault;
const serverID = config.serverID;
const {VM} = require('vm2');
const uuid4 = require('uuid/v4');
const toArr = require("./pathed.js").toArr;
const PermissionError = require("obj-perms-engine").PermissionError;
const PERMS = config.permsModule.PERMS;

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next, payload, engine) => {
        //for each user
        for (const username in state.users) {
            if (!state.users.hasOwnProperty(username))continue;
            const user = state.users[username];

            //auto run scripts
            for (const script in user.scripts) {
                if (!user.scripts.hasOwnProperty(script)) continue;
                user.scripts[script].running = false;
                engine.emit(['script_start', serverID, serverID], {
                    scriptInstanceID: script
                });
            }
        }

        next(state);
    });


    on(['create_user', '*', serverID], (state, next, payload) => {
        state.users[payload.username].scripts = {};
        next(state);
    });

    //runs a script instance
    on(['script_start', '*', serverID], (state, next, payload, engine, evt) => {
        const scriptInstanceID = payload.scriptInstanceID;
        const scripts = state.users[evt.src].scripts;
        const info = scripts[scriptInstanceID];

        //prevent script from running twice
        if (info.running) {
            engine.emit(['error_occurred', serverID, evt.src], {
                err: new Error('Script instance is already running')
            });
            next(state);
        }
        info.running = true;

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

        //detect when user accepts
        engine.on(['request_accepted', info.parentID, scriptInstanceID], (payload) => {
            if (!Array.isArray(payload))
                payload = [payload];

            if (info.requestQueue[i].reqID !== payload.firstReqID) {
                engine.emit(['error_occurred', serverID, info.parentID], {err: new Error('First reqID mismatch')});
                return;
            }

            //payload is list of accept/reject indicators
            for (let i = 0; i < payload.length; i++) {
                const reqID = info.requestQueue[i].reqID;
                const req = info.requestQueue[i].request;

                if (payload[i] === 'accept')
                    state.sandboxes[info.parentID].interface.emit(req.evt, req.payload);

                //removed accepted request
                info.requestQueue = info.requestQueue.slice(1);
                //tell script that request has beeen accepted
                engine.emit(['request_response', serverID, scriptInstanceID, config.pathMarker, reqID], payload[i]);
            }
        });

        //setup event for script to request an evt to be send as parent user
        engine.on(['request_elevated', scriptInstanceID, serverID, config.pathMarker, '*'], (payload, evt) => {
            //update request queue
            engine.emit(toArr({
                name: 'update',
                src: serverID,
                dst: serverID,
                path: ['users', info.parentID, 'scripts', scriptInstanceID, 'requestQueue']
            }), {
                value: info.requestQueue.concat([{
                    request: payload,
                    reqID: evt.path[0]
                }])
            });

            //also emit actual evt
            engine.emit(['request_elevated', scriptInstanceID, info.parentID, 'path', ...evt.path], payload);
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
                info.needInit = false;
                engine.emit(['script_init_done', scriptInstanceID, info.parentID]);
            });
            engine.emit(['init_run', serverID, scriptInstanceID]);
        }

        next(state);
    });

    //creates a script instance
    on(['instantiate_script', '*', serverID], (state, next, payload, engine, evt) => {
        //todo only user can create scripts for now
        if (state.readUserLevel(state, evt.src) > 1) //todo replace 1 with constant
            throw new PermissionError('Not enough permissions to instantiate script');

        const scriptInstanceID = uuid4();//give script new id
        const scripts = state.users[evt.src].scripts;

        //give script a user level
        state.updateUserLevel(serverID, state, scriptInstanceID, 2);//todo replace 2 with constants

        //store script info
        scripts[scriptInstanceID] = Object.assign(payload, {
            parentID: evt.src,
            needInit: true,
            requestQueue: [],
        });

        //run script
        engine.emit(['script_start', evt.src, serverID], {
            scriptInstanceID: scriptInstanceID,
        });

        //send new script id back to user
        //todo script is not really instantiated yet
        engine.emit(['script_instantiated', serverID, evt.src], {
            scriptInstanceID: scriptInstanceID,
        });

        next(state);
    });
};