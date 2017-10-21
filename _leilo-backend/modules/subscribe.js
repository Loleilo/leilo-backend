// subscribe.js  - Allows clients to see CRUD events on parts of object they are allowed to view
// This is needed because CRUD events are only sent to the server unless sender specifies otherwise

const PermissionError = require('obj-perms-engine').PermissionError;
const consts = require('../../consts');
const uuid = require('uuid/v4');
const serverID = consts.serverID;
const PERMS = consts.permsEngineOptions.permsModule.PERMS;
const pathMarker = consts.pathMarker;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    name: ['update', 'delete', 'create', 'updatePerms'],
    src: '*',
    dst: serverID,
};

module.exports = (engine, config) => {
    const prefix = uuid();

    //todo prevent duplicate subscribes
    // allows a client to subscribe to state change events if they have read perms
    engine.on(['subscribe', '*', serverID], (payload, evt) => {
        const state = engine.state;
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //find prefix of path that does not contain wildcards
        let firstIdx;
        for (firstIdx = 0; firstIdx < payload.path.length; firstIdx++)
            if (payload.path[firstIdx] === '*' || payload.path[firstIdx] === '**')
                break;

        const actualPath = payload.path.slice(0, firstIdx);

        //todo FIX THIS VERY CUSUTTTTT!!!!!!!!!
        const currID = uuid();
        let handled = false;
        const handler = (payloadInner, evtInner) => {
            if (handled)return;
            //check permissions on prefix path
            if (state.readPerms(state, actualPath, evtInner.src).lvl < PERMS.VIEWER)
                return;

            handled = true;
            engine.removeListener({name: prefix, src: '*', dst: currID}, handler);

            //convert single event name to array for easier processing
            if (!Array.isArray(payload.name))
                payload.name = [payload.name];

            const listenNames = payload.name;
            const listenSrc = payload.src;
            const listenDst = payload.dst;

            //go through every event name listed
            for (let i = 0; i < listenNames.length; i++) {
                //listener remaps event to send to subscriber
                const listener = (payloadInner, evtInner) => {
                    engine.emit([evtInner.name, listenDst, evt.src, pathMarker, ...evtInner.path], payloadInner);
                };
                engine.on([listenNames[i], listenSrc, listenDst, pathMarker, ...payload.path], listener);
            }

            //init subscriber
            engine.emit(['subscribeSync', evt.src, serverID, pathMarker, ...actualPath]);
        };
        engine.on({name: prefix, src: '*', dst: currID}, handler);

        engine.emit({name: 'proxy', src: evt.src, dst: serverID}, engine =>
            engine.emit({name: prefix, src: '*', dst: currID})
        );
    });

    //event is used to initially load the state into client
    engine.on(['subscribeSync', '*', serverID, pathMarker, '**'], (payload, evt) => {
        const state = engine.state;
        engine.emit(['update', serverID, evt.src, pathMarker, ...evt.path], {
            value: state.read(evt.src, state, evt.path)
        });
    });

    engine.on(['unsubscribe', '*', serverID], (payload) => {
        const state = engine.state;
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.name))
            payload.name = [name];

        const evtNames = payload.name;
        const evtSrc = payload.src;

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++)
            engine.removeAllListeners([evtNames[i], evtSrc, serverID, pathMarker, ...payload.path]);
    });
};