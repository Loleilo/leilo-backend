const fs = require('fs');
const JSON = require('circular-json');
const semver = require('semver');
const consts = require('../../consts');
const serverID = consts.serverID;
const version = consts.serverVersion;

module.exports = (engine, config) => {

    //must run first
    engine.onM(['serverInit', serverID, serverID], (state, next, paylod, evt) => {
        fs.readFile(config.saveLocation, (err, obj) => {
            try {
                obj = JSON.parse(obj);
            } catch (err) {
                engine.emitNext(['warning', serverID, serverID], {err: err, srcEvt: evt});
                obj = {};
            }
            if (obj.version && !semver.satisfies(obj.version, config.persistVersionRequirements)) {
                engine.emit(['error', serverID, serverID], {
                    err: new Error('Save file serverVersion mismatch')
                });
                obj = {};
            }
            if (config.saveInterval > 0)
                obj.saveTimer = setInterval(() => engine.emit(['saveServerState', serverID, serverID]), config.saveInterval);
            next(obj);
        });
    });

    engine.on(['saveServerState', serverID, serverID], () => {
        console.log("Saving to location", config.saveLocation, "...");
        engine.state.version = version;
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