// subscribe.js  - Allows clients to see CRUD events on parts of object they are allowed to view
// This is needed because CRUD events are only sent to the server unless sender specifies otherwise

const PermissionError = require('obj-perms-engine').PermissionError;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    name: ['update', 'delete', 'create', 'updatePerms'],
    src: '*',
};

module.exports = (engine, config) => {
    const serverID = config.serverID;
    const PERMS = config.permsEngineOptions.permsModule.PERMS;

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

        //check permissions on prefix path
        //todo doesn't need viewer perms for viewing update
        if (state.readPerms(state, actualPath, evt.src).lvl < PERMS.VIEWER)
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
            engine.on([evtNames[i], evtSrc, serverID, config.pathMarker, ...payload.path], listener);
        }

        //init subscriber
        engine.emit(['subscribeSync', evt.src, serverID, config.pathMarker, ...actualPath]);
    });

    //event is used to initially load the state into client
    engine.on(['subscribeSync', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;
        engine.emit(['update', serverID, evt.src, config.pathMarker, ...evt.path], {
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
            engine.removeAllListeners([evtNames[i], evtSrc, serverID, config.pathMarker, ...payload.path]);
    });
};