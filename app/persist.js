const config = require('./config');
const serverID = config.serverID;
const jsonfile = require('jsonfile');

module.exports = (on, once) => {
    on(['server_init', serverID, serverID], (state, next) => {
        jsonfile.readFile(config.saveLocation, (err, obj) => {
            if (obj) next(obj);
            else next({});
        });
    });

    once(['server_exit', serverID, serverID], (state, next) => {
        console.log("Saving to location", config.saveLocation, state);
        jsonfile.writeFile(config.saveLocation, state, (err) => next(state));
    });
};