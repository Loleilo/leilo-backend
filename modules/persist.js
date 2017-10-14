const fs = require('fs');
const JSON = require('circular-json');
const semver = require('semver');

module.exports = (engine, config) => {
    const serverID = config.serverID;

    //must run first
    engine.onM(['serverInit', serverID, serverID], (state, next, paylod, evt) => {
        fs.readFile(config.saveLocation, (err, obj) => {
            try {
                obj = JSON.parse(obj);
            } catch (err) {
                engine.emitNext(['warning', serverID, serverID], {err: err, srcEvt: evt});
                obj = undefined;
            }
            if (obj && !semver.satisfies(obj.serverVersion, config.persistVersionRequirements)) {
                engine.emit(['errorOccurred', serverID, serverID], {
                    err: new Error('Save file serverVersion mismatch')
                });
                obj = undefined;
            }
            if (!obj) obj = {serverVersion: config.serverVersion};
            if (config.saveInterval > 0)
                obj.saveTimer = setInterval(() => engine.emit(['saveServerState', serverID, serverID]), config.saveInterval);
            next(obj);
        });
    });

    engine.on(['saveServerState', serverID, serverID], () => {
        console.log("Saving to location", config.saveLocation, "...");
        fs.writeFile(config.saveLocation, JSON.stringify(engine.state), (err) => {
            if (err) engine.emit(['error', serverID, serverID], {err: err});
            console.log("Done.");
            engine.emit(['saveStateFinished', serverID, serverID]);
        });
    });

    //must run last
    engine.onceM(['serverExit', serverID, serverID], (state, next) => {
        next(state);
        clearInterval(engine.state.saveTimer);
        engine.emit(['saveServerState', serverID, serverID]);
    });
};