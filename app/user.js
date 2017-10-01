const PasswordHash = require('password-hash');
const config = require('./config');
const serverID = config.serverID;
const d = require('./util').getDefault;
const PERMS = config.permsModule.PERMS;

module.exports.middleware = (engine) => {
    engine.onM(['serverInit', serverID, serverID], (state, next) => {
        const defaultUsers = {};
        defaultUsers[serverID] = {
            passwordHash: PasswordHash.generate(config.serverDefaultPassword),
        };
        state.passwordHashes = d(state.passwordHashes, defaultUsers);
        state.users = d(state.users, {});

        next(state);
    });

    //todo remember to add this to evttables
    engine.onM(['createUser', '*', serverID], (state, next, payload) => {
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
        state.updateUserLevel(serverID, state, payload.username, 1);//todo replace 1 with constant

        next(state);
    });

    engine.onM(['changePassword', '*', serverID], (state, next, payload, evt) => {
        state.passwordHashes[evt.src] = {
            passwordHash: PasswordHash.generate(payload.password)
        };

        next(state);
    });

    engine.onM(['deleteUser', '*', serverID], (state, next, payload, evt) => {
        //todo make sure to disconnect user on delete, also to clean up user perms
        state.passwordHashes[evt.src] = null;

        next(state);
    });
};

module.exports.isValidLogin = (state, credentials) => {
    const username = credentials.username;
    if (state.passwordHashes[username])
        if (PasswordHash.verify(credentials.password, state.passwordHashes[username].passwordHash))
            return true;
    return false;
};