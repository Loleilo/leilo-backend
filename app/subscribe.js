// subscribe.js  - Redirects CRUD events to subscribed clients
//todo fix this

const deepAssign = require('deep-assign');
const config = require('./config');
const PermissionError = require('obj-perms-engine').PermissionError;
const serverID = require('./config').serverID;
const resolve = require('object-path');

const PERMS = config.permsModule.PERMS;

//payload may contain an array in evt as the list of operations to redirect
const defaultPayload = {
    evt: [['update', 'delete', 'create', 'updatePerms'], '*'],
};

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        state.evtRedirections = {};
        next(state);
    });

    on(['subscribe', '*', serverID], (state1, next1, payload1, engine, src1) => {
        payload1 = deepAssign(defaultPayload, payload1);

        if (state1.readPerms(state1, payload1.path, src1)[PERMS.READ] === undefined)
            throw PermissionError('Not enough perms');

        if (!Array.isArray(payload1.evt[0]))
            payload1.evt[0] = [payload1.evt[0]];

        for (let i = 0; i < payload1.evt.length; i++) {
            const evtName = payload1.evt[0][i];
            const actualEvt = [evtName, payload1.evt[1], src1];

            const listener = (state, next, payload, engine, src, dst) => {
                if (dst === src1)return; //don't reemit if already emitted

                if (payload.path.length > payload1.path.length)return;
                for (let j = 0; j < payload.path.length; j++)
                    if (payload1.path[j] !== payload.path[j])return;

                engine.emit([evtName, src, dst], payload);
                next(state);
            };

            resolve.insert(state1, ['evtRedirections', src1, ...([payload.listenerName] || actualEvt)], listener, 0);

            on(actualEvt, listener);
        }

        next1(state1);
    });

    on(['unsubscribe', '*', serverID], (state, next, payload, engine, src) => {
        payload = deepAssign(defaultPayload, payload);

        if (!Array.isArray(payload.evt[0]))
            payload.evt[0] = [payload.evt[0]];

        for (let i = 0; i < payload.evt.length; i++) {
            const evtName = payload.evt[0][i];
            const actualEvt = [evtName, payload1.evt[1], src1];
            for (let j = 0; j < state.evtRedirections[src][evtName].length; j++)
                engine.removeListener(actualEvt,
                    resolve.get(state, ['evtRedirections', src, ...([payload.listenerName] || actualEvt), j])
                );
        }

        next(state);
    });
};