const PasswordHash = require('password-hash');
const config = require('./config');
const serverID = config.serverID;

module.exports = (on) => {
    on(['server_init', serverID, serverID], (state, next) => {
        const defaultUsers = {};
        defaultUsers[serverID] = {
            passwordHash: PasswordHash.generate(config.serverDefaultPass),
        };
        state = Object.assign({
            users: defaultUsers,
        }, state);

        next(state);
    });

    on(['create_user', serverID, serverID], (state, next, payload) => {
        if (state.users[payload.username] !== undefined)
            throw new Error('User already exists');

        state.users[payload.username] = {
            passwordHash: PasswordHash.generate(payload.password)
        };

        next(state);
    });

    on(['change_password', '*', serverID], (state, next, payload, engine, evt) => {
        state.users[evt.src] = {
            passwordHash: PasswordHash.generate(payload.password)
        };

        next(state);
    });

    on(['delete_user', '*', serverID], (state, next, payload, engine, evt) => {
        //todo make sure to disconnect user on delete
        state.users[evt.src] = null;

        next(state);
    });

    on(['try_auth', '*', serverID], (state, next, payload, engine, evt) => {
        const src = evt.src;
        if (state.users[src] === undefined) {
            engine.emit(['auth_rejected', serverID, src]);
            return;
        }
        if (PasswordHash.verify(payload.password, state.users[src].passwordHash))
            engine.emit(['auth_successful', serverID, src]);
        else
            engine.emit(['auth_rejected', serverID, src]);
    });
};