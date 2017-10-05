const config = require('./config');
const fs = require('fs');
const JSON = require('circular-json');
const semver = require('semver');
const serverID = config.serverID;

module.exports = (engine) => {
    //must run first
    engine.onM(['serverInit', serverID, serverID], (state, next, paylod, evt) => {
        if (config.persist) {
            fs.readFile(config.saveLocation, (err, obj) => {
                try {
                    obj = JSON.parse(obj);
                } catch (err) {
                    engine.emitNext(['warning', serverID, serverID], {err: err, srcEvt: evt});
                    obj = undefined;
                }
                if (obj && !semver.satisfies(obj.version, config.persistVersionRequirements)) {
                    engine.emit(['errorOccurred', serverID, serverID], {
                        err: new Error('Save file version mismatch')
                    });
                    obj = undefined;
                }
                if (!obj) obj = {version: config.version};
                if (config.saveInterval > 0)
                    obj.saveTimer = setInterval(() => engine.emit(['saveServerState', serverID, serverID]), config.saveInterval);
                next(obj);
            });
        } else {
            next({version: config.version});
        }
    });

    if (config.persist) {
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
    }
};