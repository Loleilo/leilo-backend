const config = require('./config');
const serverID = config.serverID;
const jsonfile = require('jsonfile');

module.exports = (on, once) => {
    on(['server_init', serverID, serverID], (state, next, payload, engine) => {
        jsonfile.readFile(config.saveLocation, (err, obj) => {
            if (!obj) obj = {version: config.version};
            if (config.saveInterval > 0)
                obj.saveTimer = setInterval(() => engine.emit(['save_server_state', serverID, serverID]), config.saveInterval);
            next(obj);
        });
    });

    on(['save_server_state', serverID, serverID], (state, next, payload, engine) => {
        console.log("Saving to location", config.saveLocation, state);
        jsonfile.writeFile(config.saveLocation, state, (err) => {
            if (err) engine.emit(['error_occurred', serverID, serverID], {err: err});
            next(state);
            engine.emit(['save_state_finished', serverID, serverID]);
        });
    });

    once(['server_exit', serverID, serverID], (state, next, payload, engine) => {
        clearInterval(state.saveTimer);
        engine.emit(['save_server_state', serverID, serverID]);
        engine.once(['save_state_finished', serverID, serverID], () => next(state));
    });
};