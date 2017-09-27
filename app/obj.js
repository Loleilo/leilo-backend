const obj_perms_engine = require('obj-perms-engine');
const config = require('./config');
const serverID = config.serverID;

const ObjPermsEngine = obj_perms_engine.ObjPermsEngine;

const eng = new ObjPermsEngine({
    permsModule: config.permsModule,
});

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        //give server root perms
        eng.u_updateUserLevel(serverID, state, eng.config.USER_LEVEL.ROOT);

        //expose functions that will be required by other modules in state
        state.updatePerms = eng.updatePerms;

        next(state);
    });


    //map server CRUD events to actual object modifications

    on(['create', '*', serverID], (state, next, payload, engine, src) => {
        eng.create(src, state, payload.path, payload.newObjName, payload.newObjVal);
        next(state);
    });

    on(['update', '*', serverID], (state, next, payload, engine, src) => {
        eng.update(src, state, payload.path, payload.value);
        next(state);
    });

    on(['delete', '*', serverID], (state, next, payload, engine, src) => {
        eng.del(src, state, payload.path);
        next(state);
    });

    on(['updatePerms', '*', serverID], (state, next, payload, engine, src) => {
        eng.updatePerms(src, state, payload.path, payload.user, payload.perms);
        next(state);
    });
};