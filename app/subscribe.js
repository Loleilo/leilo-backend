// subscribe.js  - Allows clients to see CRUD events on parts of object they are allowed to view
// This is needed because CRUD events are only sent to the server unless sender specifies otherwise

const config = require('./config');
const PermissionError = require('obj-perms-engine').PermissionError;
const serverID = require('./config').serverID;

const PERMS = config.permsEngineOptions.permsModule.PERMS;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    name: ['update', 'delete', 'create', 'updatePerms'],
    src: '*',
};

module.exports = (engine) => {
    // allows a client to subscribe to state change events if they have read perms
    engine.on(['subscribe', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //find prefix of path that does not contain wildcards
        let firstIdx;
        for (firstIdx = 0; firstIdx < evt.path.length; firstIdx++)
            if (evt.path[firstIdx] === '*' || evt.path[firstIdx] === '**')
                break;

        //check permissions on prefix path
        //todo doesn't need viewer perms for viewing update
        if (state.readPerms(state, evt.path.slice(0, firstIdx), evt.src).lvl < PERMS.VIEWER)
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
                engine.emit([evtInner.name, evtInner.src, evt.src, config.pathMarker, ...evtInner.path], payloadInner);
            };
            engine.on([evtNames[i], evtSrc, serverID, config.pathMarker, ...evt.path], listener);
        }

        //init subscriber
        engine.emit(['subscribe_init', evt.src, serverID, config.pathMarker, ...evt.path]);
    });

    //event is used to initially load the state into client
    engine.on(['subscribe_init', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;
        engine.emit(['update', serverID, evt.src, config.pathMarker, ...evt.path], {
            value: state.read(evt.src, state, evt.path)
        });
    });

    engine.on(['unsubscribe', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.name))
            payload.name = [name];

        const evtNames = payload.name;
        const evtSrc = payload.src;

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++)
            engine.removeAllListeners([evtNames[i], evtSrc, serverID, ...evt.path]);
    });
};