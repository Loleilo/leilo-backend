// subscribe.js  - Allows clients to see CRUD events on parts of object they are allowed to view
// This is needed because CRUD events are only sent to the server unless sender specifies otherwise

const config = require('./config');
const PermissionError = require('obj-perms-engine').PermissionError;
const serverID = require('./config').serverID;

const PERMS = config.permsModule.PERMS;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    name: ['update', 'delete', 'create', 'updatePerms'],
    src: '*',
};

module.exports = (engine) => {
    // allows a client to subscribe to state change events if they have read perms
    engine.onM(['subscribe', '*', serverID, config.pathMarker, '**'], (state, next, payload, evt) => {
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //find prefix of path that does not contain wildcards
        let firstIdx;
        for (firstIdx = 0; firstIdx < evt.path.length; firstIdx++)
            if (evt.path[firstIdx] === '*' || evt.path[firstIdx] === '**')
                break;

        //check permissions on prefix path
        if (state.readPerms(state, evt.path.slice(0, firstIdx), evt.src).lvl<PERMS.VIEWER)
            throw new PermissionError('Not enough perms');

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.name))
            payload.name = [payload.name];

        const evtNames = payload.name;
        const evtSrc = payload.src;

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++) {
            //listener remaps event to send to subscriber
            const listener = (payloadInner, evtInner) => {
                //todo prevent duplicates (e.g. sending it to yourself)
                engine.emit([evtInner.name, evtInner.src, evt.src, ...evtInner.path], payloadInner);
            };
            engine.on([evtNames[i], evtSrc, serverID, ...evt.path], listener);
        }

        next(state);
    });

    engine.onM(['unsubscribe', '*', serverID, config.pathMarker, '**'], (state, next, payload) => {
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.name))
            payload.name = [name];

        const evtNames = payload.name;
        const evtSrc = payload.src;

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++)
            engine.removeAllListeners([evtNames[i], evtSrc, serverID, ...evt.path]);

        next(state);
    });
};