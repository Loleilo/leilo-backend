const config = require('./config');
const serverID = config.serverID;
const jsonfile = require('jsonfile');

module.exports = (engine) => {
    engine.onM(['serverInit', serverID, serverID], (state, next) => {
        jsonfile.readFile(config.saveLocation, (err, obj) => {
            if (!obj) obj = {version: config.version};
            if (config.saveInterval > 0)
                obj.saveTimer = setInterval(() => engine.emit(['saveServerState', serverID, serverID]), config.saveInterval);
            next(obj);
        });
    });

    engine.onM(['saveServerState', serverID, serverID], (state, next) => {
        console.log("Saving to location", config.saveLocation, state);
        jsonfile.writeFile(config.saveLocation, state, (err) => {
            if (err) engine.emit(['errorOccurred', serverID, serverID], {err: err});
            next(state);
            engine.emit(['saveStateFinished', serverID, serverID]);
        });
    });

    engine.onceM(['serverExit', serverID, serverID], (state, next) => {
        clearInterval(state.saveTimer);
        engine.emit(['saveServerState', serverID, serverID]);
        engine.once(['saveStateFinished', serverID, serverID], () => next(state));
    });
};