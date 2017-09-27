const WebSocket = require('ws');
const config = require('./config');
const serverID = config.serverID;

//handles a client websocket connection
module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next, payload, engine) => {
        const wss = new WebSocket.Server({port: 80});
        wss.on('connection', (ws) => {
            ws.send(`try_auth ${config.version}`);
            ws.once('message', (data) => {
                const msg = JSON.parse(data);
                const successHandler = () => {
                    engine.removeListener(['auth_rejected', serverID, msg.username], rejectHandler);
                    ws.send(`auth_successful`);
                    const currClientID = msg.username;
                    console.log(`User @${currClientID} authenticated`);

                    //auto disconnects on implicit disconnect (socket closed without warning)
                    function autoDisconnectAddListener(emitter, event, listener) {
                        //wrapper emits client_disconnected when listener is called and ws is not open
                        const listenerWrapped = function (...args) {
                            if (ws.readyState !== WebSocket.OPEN)
                                engine.emit(['client_disconnected', currClientID, '*']);
                            else listener.call(this, ...args);
                        };

                        //handler removes the listener
                        engine.once(['client_disconnected', currClientID, currClientID], () => emitter.removeListener(event, listenerWrapped));

                        emitter.on(event, listenerWrapped);
                    }

                    //emit disconnected also in explicit disconnect
                    ws.once('disconnect', () => engine.emit(['client_disconnected', currClientID, '*']));

                    //pipe client messages to server
                    autoDisconnectAddListener(ws, 'message', (message) => {
                        const msg = JSON.parse(message);
                        engine.emit([msg.type, currClientID, msg.dst], msg.payload);
                    });

                    //pipe server messages to client
                    autoDisconnectAddListener(engine, ['*', '*', currClientID], function (payload) {
                        const msg = JSON.stringify({
                            type: this.event[0],
                            src: this.event[1],
                            payload: payload,
                        });
                        ws.send(msg);
                    });

                    //display disconnected message
                    engine.once(['client_disconnected', currClientID, currClientID], () => {
                        console.log(`Client @${currClientID} disconnected`);
                    });

                    //send client connected event
                    engine.emit('client_connected', undefined, currClientID);
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