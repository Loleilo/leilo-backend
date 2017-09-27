// subscribe.js  - Redirects CRUD events to subscribed clients

const objectAssignDeep = require(`object-assign-deep`);
const config = require('./config');
const PermissionError = require('obj-perms-engine').PermissionError;
const serverID = require('./config').serverID;

const PERMS = config.permsModule.PERMS;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    evt: [['update', 'delete', 'create', 'updatePerms'], '*', '*'],
};

module.exports = (on) => {
    // allows a client to subscribe to state change events if they have read perms
    on(['subscribe', '*', serverID], (state, next, payload, engine, evt) => {
        payload = objectAssignDeep({}, defaultPayload, payload); //default perms

        //check permissions
        if (state.readPerms(state, payload.path, evt.src)[PERMS.READ] === undefined)
            throw PermissionError('Not enough perms');

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.evt[0]))
            payload.evt[0] = [payload.evt[0]];

        const evtNames = payload.evt[0];
        const evtSrc = payload.evt[1]; //todo later restrict who can see src and dst

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++) {
            //listener remaps event to send to subscriber
            const listener = (payloadInner, evt) => {
                //if (evt.dst !== serverID)return;//todo fix this custy check to prevent duplicate sends
                engine.emit([evtNames[i], evtSrc, evt.src, ...payload.path], payloadInner);
            };
            engine.on([evtNames[i], evtSrc, serverID, ...payload.path], listener);
        }

        next(state);
    });

    on(['unsubscribe', '*', serverID], (state, next, payload, engine) => {
        payload = objectAssignDeep({}, defaultPayload, payload); //default perms

        //convert single event name to array for easier processing
        if (!Array.isArray(payload.evt[0]))
            payload.evt[0] = [payload.evt[0]];

        const evtNames = payload.evt[0];
        const evtSrc = payload.evt[1];

        //go through every event name listed
        for (let i = 0; i < evtNames.length; i++)
            engine.removeAllListeners([evtNames[i], evtSrc, serverID, ...payload.path]);

        next(state);
    });
};