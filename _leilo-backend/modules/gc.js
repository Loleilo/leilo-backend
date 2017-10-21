//simply syntactic sugar to help garbage collect

const toObj = require("../../pathed.js").toObj;
const consts = require('../../consts');
const serverID = consts.serverID;
const USER_LEVEL = consts.permsEngineOptions.USER_LEVEL;

module.exports = (engine) => {

    //todo gc should be serializable
    engine.on(['gc', '*', serverID, consts.pathMarker, '**'], (payload, evt) => {
        const state = engine.state;

        if (!Array.isArray(payload[0]))
            payload = [payload];

        for (let i = 0; i < payload.length; i++) {
            const callback = () => engine.emit(['delete', evt.src, serverID, consts.pathMarker, ...evt.path]);
            if (state.readUserLevel(state, evt.src) >= USER_LEVEL.USER)
                engine.emit({name: 'proxy', src: evt.src, dst: serverID}, engine =>
                    engine.on(payload[i], callback)
                );
            else
                engine.on(payload[i], callback);
        }
    });
};