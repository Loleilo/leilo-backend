const Engine = require('./app/engine');
const config = require('./app/config');

const obj = require('./app/obj');
const subscribe = require('./app/subscribe');
const wsConnector = require('./app/wsConnector');
const user = require('./app/user');
const debug = require('./app/debug');
const persist = require('./app/persist');
const scripts = require('./app/scripts');
const gc = require('./app/gc');
const evtTables = require('./app/evtTables');
const funcOr = require("./app/util.js").funcOr;

const serverID = config.serverID;

//main app
module.exports = (_config) => {
    if (_config)
        Object.assign(config, _config);

    const engine = new Engine();

    if (config.persist)
        persist(engine);
    evtTables.evtTable(engine);
    obj(engine);
    subscribe(engine);
    user.middleware(engine);
    scripts(engine);
    gc(engine);
    debug(engine);
    wsConnector(engine);

    engine.once(['serverExit', serverID, serverID], () => setTimeout(process.exit, config.exitDelay));
    const h = funcOr(() => engine.emit(['serverExit', serverID, '*']), 5, true);
    process.once('exit', h[0]);
    process.once('SIGINT', h[1]);
    process.once('SIGUSR1', h[2]);
    process.once('SIGUSR2', h[3]);
    // process.once('uncaughtException', () => engine.emit(['server_exit', serverID, '*']));

    engine.emit(["serverInit", serverID, serverID]);

    console.log("Server is running");
};