//simply syntactic sugar to help garbage collect
const config = require('./config');
const serverID = config.serverID;
const USER_LEVEL = config.permsEngineOptions.USER_LEVEL;

module.exports = (engine) => {
    engine.on(['gc', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;

        let on = engine.on;
        if (state.readUserLevel(state, evt.src) >= USER_LEVEL.USER)
            on = engine.state.sandboxes[evt.src].interface.on;

        on(payload.evt, () => engine.emit(['del', evt.src, serverID, config.pathMarker, ...evt.path]));
    });
};