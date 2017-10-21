const sio = require('socket.io');
const JSON = require('circular-json');
const toArr = require("../../pathed.js").toArr;
const consts = require('../../consts');
const serverID = consts.serverID;
const pathMarker = consts.pathMarker;
const USER_LEVEL = consts.permsEngineOptions.USER_LEVEL;

let globalConnectionID = 0;

//handles a client websocket connection
module.exports = (engine, config) => {
    engine.on(['serverInit', serverID, serverID], () => {
        const state = engine.state;
        state.sandboxes = {};

        const wss = sio.listen(config.serverPort);
        wss.on('connection', (ws) => {

            //find username that is not taken
            //let cust;
            //todo while (state.readUserLevel(state, globalConnectionID)<) {
            globalConnectionID++;
            // }

            const currConnectionID = "connection#" + globalConnectionID;
            ws.once('disconnect', () => {
                //delete user
                state.updateUserLevel(serverID, state, currConnectionID, undefined);
                engine.emit(['clientDisconnected', currConnectionID, currConnectionID]);
            });

            //creates a listener that is automatically removed when ws disconnects
            const autoDisconnectAddListener = (emitter, evt, listener, once = false) => {
                let func = emitter.on.bind(emitter);
                if (once) func = emitter.once.bind(emitter);

                let actualFunc = func(evt, listener);
                if (typeof(actualFunc) !== 'function') actualFunc = listener;

                //handler removes the listener
                engine.once(['clientDisconnected', currConnectionID, serverID], () => emitter.removeListener(actualFunc));
            };

            //create temp user for connection
            state.updateUserLevel(serverID, state, currConnectionID, USER_LEVEL.CONN);

            //pipe client messages to server
            autoDisconnectAddListener(ws, 'message', (message, callback) => {
                try {
                    const msg = JSON.parse(message);
                    engine.emit({name: 'proxy', src: currConnectionID, dst: serverID}, engine =>
                        engine.emit(msg.evt, msg.payload)
                    );

                    //ack callback
                    if (typeof(callback) === 'function') {
                        engine.onM(msg.evt, (state, next) => {
                            next(state);
                            callback();
                        });
                    }
                } catch (err) {
                    engine.emit(['error', currConnectionID, currConnectionID], {
                        err: err.toString()
                    });
                }
            });

            //handles when server sends messages to client
            const serverEvtHandler = (payload, evt) => {
                const msg = JSON.stringify({
                    evt: evt,
                    payload: payload,
                });
                ws.send(msg);
            };
            const pipeToClient = dst => engine.emit({name: 'proxy', src: currConnectionID, dst: serverID}, engine => {
                autoDisconnectAddListener(engine, {
                    name: '*',
                    src: '*',
                    dst: dst,
                }, serverEvtHandler);
                autoDisconnectAddListener(engine, {
                    name: '*',
                    src: '*',
                    path: ['**'],
                    dst: dst,
                }, serverEvtHandler);
            });
            pipeToClient(currConnectionID);

            engine.on({name: 'authSuccess', src: serverID, dst: currConnectionID}, (payload) => {
                engine.emit({name: 'authProxy', src: serverID, dst: currConnectionID}, payload);
                pipeToClient(payload);
            });

            //send client connected event
            engine.emit(['clientConnected', serverID, serverID], currConnectionID);

            //forceDisconnect
            autoDisconnectAddListener(engine, {
                name: 'forceDisconnect',
                src: serverID,
                dst: currConnectionID
            }, ws.disconnect, true);

            //send init data
            ws.send(JSON.stringify({
                evt: {
                    name: 'init',
                    src: serverID,
                    dst: currConnectionID,
                },
                payload: {
                    version: consts.serverVersion,
                    connID: currConnectionID,
                }
            }));
        });
    })
};