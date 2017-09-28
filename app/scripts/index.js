const sandbox = require('../sandbox');
const config = require('../config');
const d = require('../util').getDefault;
const serverID = config.serverID;
const CRUDPerms = require('obj-perms-engine').CRUDPerms;

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        state.scripts = d(state.scripts, {});
        state.updatePerms(serverID, state, ['scripts'], config.permsWildcard, {
          'CRT':true,
        });

        next(state);
    });

    on(['create_script', '*', serverID], (state, next, payload) => {

        next(state);
    });
};