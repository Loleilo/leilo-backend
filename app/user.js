const PasswordHash = require('password-hash');
const config = require('./config');
const serverID = config.serverID;
const d = require('./util').getDefault;

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        const defaultUsers = {};
        defaultUsers[serverID] = {
            passwordHash: PasswordHash.generate(config.serverDefaultPass),
        };
        state.users = d(state.users, defaultUsers);

        next(state);
    });

    on(['create_user', serverID, serverID], (state, next, payload) => {
        if (state.users[payload.username] !== undefined)
            throw new Error('User already exists');

        state.users[payload.username] = {
            passwordHash: PasswordHash.generate(payload.password)
        };

        //give user level
        state.updateUserLevel(serverID, state, payload.username, 1);//todo replace 1 with constant

        next(state);
    });

    on(['change_password', '*', serverID], (state, next, payload, engine, evt) => {
        state.users[evt.src] = {
            passwordHash: PasswordHash.generate(payload.password)
        };

        next(state);
    });

    on(['delete_user', '*', serverID], (state, next, payload, engine, evt) => {
        //todo make sure to disconnect user on delete, also to clean up user perms
        state.users[evt.src] = null;

        next(state);
    });

    //todo convert this to simple function
    on(['try_auth', '*', serverID], (state, next, payload, engine, evt) => {
        const username = payload.username;
        if (state.users[username] === undefined) {
            engine.emit(['auth_rejected', serverID, evt.src]);
        } else {
            if (PasswordHash.verify(payload.password, state.users[username].passwordHash))
                engine.emit(['auth_successful', serverID, evt.src]);
            else
                engine.emit(['auth_rejected', serverID, evt.src]);
        }
        next(state);
    });
};