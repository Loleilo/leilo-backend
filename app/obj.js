const obj_perms_engine = require('obj-perms-engine');
const config = require('./config');
const serverID = config.serverID;

const ObjPermsEngine = obj_perms_engine.ObjPermsEngine;

const eng = new ObjPermsEngine({
    USER_LEVEL: {
        ROOT: 0,
        USER: 1,
        PRGM: 2,
    },
    WILDCARD: config.permsWildcard,
    permsModule: config.permsModule,
});

module.exports = (engine) => {
    engine.onM(['serverInit', serverID, serverID], (state, next) => {
        //give server root perms
        eng.u_updateUserLevel(serverID, state, eng.config.USER_LEVEL.ROOT);

        //expose functions that will be required by other modules in state
        state.readPerms = eng.readPerms;
        state.read = eng.read;
        state.readUserLevel = eng.readUserLevel;
        //todo these should be called through events
        state.updateUserLevel = eng.updateUserLevel;
        state.updatePerms = eng.updatePerms;
        state.updatePerm = eng.updatePerm;

        next(state);
    });


    //map server CRUD events to actual object modifications

    engine.on(['updateUserLevel', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        eng.updateUserLevel(evt.src, engine.state, payload.user, payload.level);
    });

    engine.on(['create', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        eng.create(evt.src, engine.state, evt.path, payload.newObjName, payload.newObjVal);
    });

    engine.on(['update', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        eng.update(evt.src, engine.state, evt.path, payload.value);
    });

    engine.on(['delete', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        eng.del(evt.src, engine.state, evt.path);
    });

    engine.on(['updatePerms', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        eng.updatePerms(evt.src, engine.state, evt.path, payload.user, payload.perms);
    });
};