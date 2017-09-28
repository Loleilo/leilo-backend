const obj_perms_engine = require('obj-perms-engine');
const config = require('./config');
const serverID = config.serverID;

const ObjPermsEngine = obj_perms_engine.ObjPermsEngine;

const eng = new ObjPermsEngine({
    USER_LEVEL: {
        ROOT: 0,
        USER: 1,
        PRGM: 3,
    },
    WILDCARD:config.permsWildcard,
});

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        //give server root perms
        eng.u_updateUserLevel(serverID, state, eng.config.USER_LEVEL.ROOT);

        //expose functions that will be required by other modules in state
        state.readPerms = eng.readPerms;

        next(state);
    });


    //map server CRUD events to actual object modifications

    on(['create', '*', serverID, '**'], (state, next, payload, engine, evt) => {
        eng.create(evt.src, state, evt.path, payload.newObjName, payload.newObjVal);
        next(state);
    });

    on(['update', '*', serverID, '**'], (state, next, payload, engine, evt) => {
        eng.update(evt.src, state, evt.path, payload.value);
        next(state);
    });

    on(['delete', '*', serverID, '**'], (state, next, payload, engine, evt) => {
        eng.del(evt.src, state, evt.path);
        next(state);
    });

    on(['updatePerms', '*', serverID, '**'], (state, next, payload, engine, evt) => {
        eng.updatePerms(evt.src, state, evt.path, payload.user, payload.perms);
        next(state);
    });
};