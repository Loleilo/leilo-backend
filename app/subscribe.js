// subscribe.js  - Redirects CRUD events to subscribed clients
const config = require('./config');
const PermissionError = require('obj-perms-engine').PermissionError;
const serverID = require('./config').serverID;

const PERMS = config.permsModule.PERMS;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    name: ['update', 'delete', 'create', 'updatePerms'],
    src: '*',
};

module.exports = (on) => {
    // allows a client to subscribe to state change events if they have read perms
    on(['subscribe', '*', serverID], (state, next, payload, engine, evt) => {
        payload = Object.assign({}, defaultPayload, payload); //default perms

        //find prefix of path that does not contain wildcards
        let firstIdx;
        for (firstIdx = 0; firstIdx < payload.path.length; firstIdx++)
            if (payload.path[firstIdx] === '*' || payload.path[firstIdx] === '**')
                break;

        //check permissions on prefix path
        if (!state.readPerms(state, payload.path.slice(0, firstIdx), evt.src)[PERMS.READ])
            throw new PermissionError('Not enough perms');

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.name))
            payload.name = [payload.name];

        const evtNames = payload.name;
        const evtSrc = payload.src; //todo later restrict who can see src and dst

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++) {
            //listener remaps event to send to subscriber
            const listener = (payloadInner, evtInner) => {
                //if (evt.dst !== serverID)return;//todo fix this custy check to prevent duplicate sends
                engine.emit([evtInner.name, evtInner.src, evt.src, ...evtInner.path], payloadInner);
            };
            engine.on([evtNames[i], evtSrc, serverID, ...payload.path], listener);
        }

        next(state);
    });

    on(['unsubscribe', '*', serverID], (state, next, payload, engine) => {
        payload = objectAssignDeep({}, defaultPayload, payload); //default perms

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.name))
            payload.name = [name];

        const evtNames = payload.name;
        const evtSrc = payload.src;

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++)
            engine.removeAllListeners([evtNames[i], evtSrc, serverID, ...payload.path]);

        next(state);
    });
};