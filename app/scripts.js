const config = require('./config');
const Sandbox = require("./sandbox.js").Sandbox;
const d = require('./util').getDefault;
const serverID = config.serverID;
const {VM} = require('vm2');
const uuid4 = require('uuid/v4');
const toArr = require("./pathed.js").toArr;
const PermissionError = require("obj-perms-engine").PermissionError;
const PERMS = config.permsModule.PERMS;

module.exports = (engine) => {
    engine.onM(['serverInit', serverID, serverID], (state, next) => {
        //for each user
        for (const username in state.users) {
            if (!state.users.hasOwnProperty(username))continue;
            const user = state.users[username];

            //auto run scripts
            for (const script in user.scripts) {
                if (!user.scripts.hasOwnProperty(script)) continue;
                user.scripts[script].running = false;
                engine.emit(['scriptStart', serverID, serverID], {
                    scriptInstanceID: script
                });
            }
        }

        next(state);
    });


    engine.on(['createUser', '*', serverID], ( payload) => {
        engine.state.users[payload.username].scripts = {};
    });

    //runs a script instance
    engine.on(['scriptStart', '*', serverID], ( payload, evt) => {
        const state=engine.state;
        const scriptInstanceID = payload.scriptInstanceID;
        const scripts = state.users[evt.src].scripts;
        const info = scripts[scriptInstanceID];

        //prevent script from running twice
        if (info.running) {
            engine.emit(['errorOccurred', serverID, evt.src], {
                err: new Error('Script instance is already running')
            });
            return;
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
        engine.on(['requestAccepted', info.parentID, scriptInstanceID], (payload) => {
            let lst = payload.responseLst;

            if (info.requestQueue.length < lst.length) {
                engine.emit(['errorOccurred', serverID, info.parentID], {err: new Error('More answers than requests')});
                return;
            }

            //concurrency safe check
            if (info.requestQueue[0].reqID !== payload.firstReqID) {
                engine.emit(['errorOccurred', serverID, info.parentID], {err: new Error('First reqID mismatch')});
                return;
            }

            //payload is list of accept/reject indicators
            while (lst.length > 0) {
                const reqID = info.requestQueue[0].reqID;
                const req = info.requestQueue[0].request;

                //store res
                let ans = lst[0];

                //remove from lists
                lst = lst.slice(1);
                info.requestQueue = info.requestQueue.slice(1);

                if (ans === 'accept')
                    state.sandboxes[info.parentID].interface.emit(req.evt, req.payload);

                //allow user to fake accept
                if (ans === 'skip')
                    ans = 'accept';

                //tell script that request has beeen accepted
                engine.emit(['requestResponse', serverID, scriptInstanceID, config.pathMarker, reqID], ans);
            }
        });

        //setup event for script to request an evt to be send as parent user
        engine.on(['requestElevated', scriptInstanceID, serverID, config.pathMarker, '*'], (payload, evt) => {
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
            engine.emit(['requestElevated', scriptInstanceID, info.parentID, config.pathMarker, ...evt.path], payload);
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
            engine.once(['initDone', scriptInstanceID, serverID], () => {
                info.needInit = false;
                engine.emit(['scriptInitDone', scriptInstanceID, info.parentID]);
            });
            engine.emit(['initRun', serverID, scriptInstanceID]);
        }
    });

    //creates a script instance
    engine.on(['instantiateScript', '*', serverID], (payload, evt) => {
        const state=engine.state;
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
        engine.emit(['scriptStart', evt.src, serverID], {
            scriptInstanceID: scriptInstanceID,
        });

        //send new script id back to user
        //todo script is not really instantiated yet
        engine.emit(['scriptInstantiated', serverID, evt.src], {
            scriptInstanceID: scriptInstanceID,
        });
    });
};