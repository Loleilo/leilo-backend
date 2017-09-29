const WebSocket = require('ws');
const config = require('./config');
var isValidLogin = require("./user.js").isValidLogin;
const serverID = config.serverID;
const Sandbox = require('./sandbox').Sandbox;

let globalConnectionID = 0;

//handles a client websocket connection
module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next, payload, engine) => {
        const wss = new WebSocket.Server({port: 80});
        wss.on('connection', (ws) => {
            globalConnectionID++;
            const currConnectionID = "unauthenticated_connection_" + globalConnectionID;
            ws.send(`try_auth ${config.version}`);

            ws.once('message', (data) => { //todo fix issue of this disconnecting, also fix error catching
                const msg = JSON.parse(data);

                if (isValidLogin(engine.state, msg)) {
                    ws.send(`auth_successful`); //send indicator

                    //store current client username
                    const currClientID = msg.username;
                    console.log(`User @${currClientID} authenticated`);

                    //create sandbox for client
                    const clientSandbox = new Sandbox(engine, currClientID);

                    //auto disconnects on implicit disconnect (socket closed without warning)
                    function autoDisconnectAddListener(emitter, evt, listener) {
                        //wrapper emits client_disconnected when listener is called and ws is not open
                        const listenerWrapped = (...args) => {
                            if (ws.readyState !== WebSocket.OPEN)
                                engine.emit(['client_disconnected', currClientID, serverID]);
                            else listener(...args);
                        };

                        let actualFunc = emitter.on(evt, listenerWrapped);
                        if (actualFunc === undefined) actualFunc = listenerWrapped;

                        //handler removes the listener
                        engine.once(['client_disconnected', currClientID, serverID],
                            () => emitter.removeListener(evt, actualFunc));
                    }

                    //emit disconnected also in explicit disconnect
                    ws.once('disconnect', () => engine.emit(['client_disconnected', currClientID, serverID]));

                    //pipe client messages to server
                    autoDisconnectAddListener(ws, 'message', (message) => {
                        const msg = JSON.parse(message);
                        clientSandbox.interface.emit(msg.evt, msg.payload);
                    });

                    //handles when server sends messages to client
                    const serverEvtHandler = (payload, evt) => {
                        const msg = JSON.stringify({
                            evt: evt,
                            payload: payload,
                        });
                        ws.send(msg);
                    };

                    //pipe server messages to client
                    autoDisconnectAddListener(clientSandbox.interface, {
                        name: '*',
                        src: '*',
                    }, serverEvtHandler);
                    autoDisconnectAddListener(clientSandbox.interface, {
                        name: '*',
                        src: '*',
                        path: ['**'],
                    }, serverEvtHandler);

                    //display disconnected message
                    engine.once(['client_disconnected', currClientID, currClientID], () => {
                        console.log(`Client @${currClientID} disconnected`);
                    });

                    //send client connected event
                    engine.emit(['client_connected', serverID, serverID], undefined, currClientID);
                } else {
                    ws.send(`auth_rejected`);
                    ws.close();
                }
            });
        });

        next(state);
    })
};