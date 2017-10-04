//simply syntactic sugar to help garbage collect
const config = require('./config');
const toObj = require("./pathed.js").toObj;
const serverID = config.serverID;
const USER_LEVEL = config.permsEngineOptions.USER_LEVEL;

module.exports = (engine) => {
    //todo allow obj
    engine.on(['gc', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;

        if (!Array.isArray(payload[0]))
            payload = [payload];

        for (let i = 0; i < payload.length; i++) {
            const callback = () => engine.emit(['delete', evt.src, serverID, config.pathMarker, ...evt.path]);
            if (state.readUserLevel(state, evt.src) >= USER_LEVEL.USER)
                engine.state.sandboxes[evt.src].interface.on(toObj(payload[i]), callback);
            else
                engine.on(payload[i], callback);
        }
    });
};