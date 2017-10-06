const PasswordHash = require('password-hash');
const config = require('./config');
const serverID = config.serverID;
const d = require('./util').getDefault;
const PERMS = config.permsEngineOptions.permsModule.PERMS;
const USER_LEVEL=config.permsEngineOptions.USER_LEVEL;

module.exports.middleware = (engine) => {
    engine.onM(['serverInit', serverID, serverID], (state, next) => {
        state.passwordHashes = d(state.passwordHashes, config.defaultPasswordHashes);
        state.users = d(state.users, {});
        next(state);
    });

    //todo remember to add this to evttables
    engine.on(['createUser', '*', serverID], (payload) => {
        const state = engine.state;

        if (state.passwordHashes[payload.username] !== undefined)
            throw new Error('User already exists');

        state.passwordHashes[payload.username] = {
            passwordHash: PasswordHash.generate(payload.password)
        };

        //give user location
        state.users[payload.username] = {};
        state.updatePerms(serverID, state, ['users', payload.username], payload.username, {
            lvl: PERMS.EDITOR,
        });

        //give user level
        state.updateUserLevel(serverID, state, payload.username, USER_LEVEL.USER);
    });

    engine.on(['changePassword', '*', serverID], (payload, evt) => {
        engine.state.passwordHashes[evt.src] = {
            passwordHash: PasswordHash.generate(payload.password)
        };
    });

    engine.on(['deleteUser', '*', serverID], (payload, evt) => {
        engine.state.passwordHashes[evt.src] = undefined;//todo move this to gc job
        engine.emit(['userDeleted', serverID, evt.src]);
        engine.emitNext(['forceDisconnect', serverID, evt.src]);
    });
};

module.exports.isValidLogin = (state, credentials) => {
    const username = credentials.username;
    if (state.passwordHashes[username])
        if (PasswordHash.verify(credentials.password, state.passwordHashes[username].passwordHash))
            return true;
    return false;
};