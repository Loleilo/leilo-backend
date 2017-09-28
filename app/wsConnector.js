const WebSocket = require('ws');
const config = require('./config');
const serverID = config.serverID;
const d = require("./util").getDefault;
const Sandbox = require('./sandbox').SandBox;

//handles a client websocket connection
module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next, payload, engine) => {
        const wss = new WebSocket.Server({port: 80});
        wss.on('connection', (ws) => {
            ws.send(`try_auth ${config.version}`);
            ws.once('message', (data) => { //todo fix issue of this disconnecting
                const msg = JSON.parse(data);
                const successHandler = () => {
                    engine.removeListener(['auth_rejected', serverID, msg.username], rejectHandler);
                    ws.send(`auth_successful`);
                    const currClientID = msg.username;
                    console.log(`User @${currClientID} authenticated`);

                    const clientSandbox = new Sandbox(engine, currClientID);

                    //auto disconnects on implicit disconnect (socket closed without warning)
                    function autoDisconnectAddListener(emitter, event, listener) {
                        //wrapper emits client_disconnected when listener is called and ws is not open
                        const listenerWrapped = (...args) => {
                            if (ws.readyState !== WebSocket.OPEN)
                                engine.emit(['client_disconnected', currClientID, serverID]);
                            else listener.call(this, ...args);
                        };

                        let actualFunc = emitter.on(event, listenerWrapped);
                        if (actualFunc === undefined) actualFunc = listenerWrapped;

                        //handler removes the listener
                        engine.once(['client_disconnected', currClientID, serverID],
                            () => emitter.removeListener(event, actualFunc));
                    }

                    //emit disconnected also in explicit disconnect
                    ws.once('disconnect', () => engine.emit(['client_disconnected', currClientID, serverID]));

                    //pipe client messages to server
                    autoDisconnectAddListener(ws, 'message', (message) => {
                        const msg = JSON.parse(message);
                        clientSandbox.interface.emit(msg.evt, msg.payload);
                    });

                    //pipe server messages to client
                    autoDisconnectAddListener(clientSandbox.interface, ['*', '*', currClientID, '**'], (payload, evt) => {
                        const msg = JSON.stringify({
                            evt: evt,
                            payload: payload,
                        });
                        ws.send(msg);
                    });

                    //display disconnected message
                    engine.once(['client_disconnected', currClientID, currClientID], () => {
                        console.log(`Client @${currClientID} disconnected`);
                    });

                    //send client connected event
                    engine.emit(['client_connected', serverID, serverID], undefined, currClientID);
                };
                const rejectHandler = () => {
                    engine.removeListener(['auth_successful', serverID, msg.username], successHandler);
                    ws.send(`auth_rejected`);
                    ws.close();
                };
                engine.once(['auth_successful', serverID, msg.username], successHandler);
                engine.once(['auth_rejected', serverID, msg.username], rejectHandler);
                engine.emit(['try_auth', msg.username, serverID], msg);
            });
        });

        next(state);
    })
};