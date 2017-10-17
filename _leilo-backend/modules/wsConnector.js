const sio = require('socket.io');
const isValidLogin = require("./user.js").isValidLogin;
const Sandbox = require('./sandbox').Sandbox;
const JSON = require('circular-json');
const toArr = require("../../pathed.js").toArr;
const consts = require('../../consts');
const serverID = consts.serverID;
const pathMarker = consts.pathMarker;

let globalConnectionID = 0;

//handles a client websocket connection
module.exports = (engine, config) => {

    engine.on(['serverInit', serverID, serverID], () => {
        const state = engine.state;
        state.sandboxes = {};
        const wss = sio.listen(config.serverPort);
        wss.on('connection', (ws) => {
            globalConnectionID++;
            const currConnectionID = "connection#" + globalConnectionID;
            ws.send(`tryAuth ${consts.serverVersion}`);

            ws.once('disconnect', () => engine.emit(['clientDisconnected', currConnectionID, currConnectionID]));

            //auto disconnects on implicit disconnect (socket closed without warning)
            const autoDisconnectAddListener = (emitter, evt, listener, id, once = false) => {
                let func = emitter.on.bind(emitter);
                if (once) func = emitter.once.bind(emitter);

                let actualFunc = func(evt, listener);
                if (typeof(actualFunc) !== 'function') actualFunc = listener;

                //handler removes the listener
                engine.once(['clientDisconnected', id, serverID],
                    () => emitter.removeListener(evt, actualFunc));
            };

            const messageHandler = (data) => {
                let msg;
                try {
                    msg = JSON.parse(data);
                } catch (err) {
                    engine.emit(['error', currConnectionID, serverID], {
                        err: new Error("Couldn't parse JSON")
                    });
                    return;
                }

                if (msg !== undefined && isValidLogin(engine.state, msg)) {
                    ws.send(`authSuccessful`); //send indicator

                    //store current client username
                    const currClientID = msg.username;

                    //create sandbox for client
                    let clientSandbox;
                    if (state.sandboxes[currClientID] === undefined) {
                        clientSandbox = new Sandbox(engine, currClientID);
                        state.sandboxes[currClientID] = clientSandbox;
                        //cleanup
                        engine.emitNext(['gc', serverID, serverID, pathMarker, 'sandboxes', currClientID],
                            [['serverExit', serverID, serverID],
                                ['userDeleted', serverID, currClientID],]);
                    } else clientSandbox = state.sandboxes[currClientID];

                    //pipe client messages to server
                    autoDisconnectAddListener(ws, 'message', (message, callback) => {
                        try {
                            const msg = JSON.parse(message);
                            clientSandbox.interface.emit(msg.evt, msg.payload);

                            //ack callback
                            if (typeof(callback) === 'function') {
                                engine.onM(toArr(msg.evt), (state, next) => {
                                    next(state);
                                    callback();
                                });
                            }
                        } catch (err) {
                            engine.emit(['error', currClientID, currClientID], {
                                err: err.toString()
                            });
                        }
                    }, currConnectionID);

                    //handles when server sends messages to client
                    const serverEvtHandler = (payload, evt) => {
                        //todo if (evt.src === currClientID)return; //prevents getting self messages
                        const msg = JSON.stringify({
                            evt: evt,
                            payload: payload,
                        });
                        ws.send(msg);
                    };
                    autoDisconnectAddListener(clientSandbox.interface, {
                        name: '*',
                        src: '*',
                    }, serverEvtHandler, currConnectionID);
                    autoDisconnectAddListener(clientSandbox.interface, {
                        name: '*',
                        src: '*',
                        path: ['**'],
                    }, serverEvtHandler, currConnectionID);

                    //send client connected event
                    engine.emit(['clientConnected', serverID, serverID], undefined, currClientID);

                    //forceDisconnect
                    autoDisconnectAddListener(engine, {
                        name: 'forceDisconnect',
                        src: serverID,
                        dst: currClientID
                    }, ws.disconnect, currConnectionID, true);
                } else {
                    ws.send(`authRejected`);
                    ws.disconnect();
                }
            };

            autoDisconnectAddListener(ws, 'message', messageHandler, currConnectionID, true);
        });
    })
};