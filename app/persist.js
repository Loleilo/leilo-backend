const config = require('./config');
const serverID = config.serverID;
const jsonfile = require('jsonfile');

module.exports = (on, once) => {
    on(['serverInit', serverID, serverID], (state, next, payload, engine) => {
        jsonfile.readFile(config.saveLocation, (err, obj) => {
            if (!obj) obj = {version: config.version};
            if (config.saveInterval > 0)
                obj.saveTimer = setInterval(() => engine.emit(['saveServerState', serverID, serverID]), config.saveInterval);
            next(obj);
        });
    });

    on(['saveServerState', serverID, serverID], (state, next, payload, engine) => {
        console.log("Saving to location", config.saveLocation, state);
        jsonfile.writeFile(config.saveLocation, state, (err) => {
            if (err) engine.emit(['errorOccurred', serverID, serverID], {err: err});
            next(state);
            engine.emit(['saveStateFinished', serverID, serverID]);
        });
    });

    once(['serverExit', serverID, serverID], (state, next, payload, engine) => {
        clearInterval(state.saveTimer);
        engine.emit(['saveServerState', serverID, serverID]);
        engine.once(['saveStateFinished', serverID, serverID], () => next(state));
    });
};