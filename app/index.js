const Engine = require('./engine');
const config = require('./config');

const obj = require('./obj');
const subscribe = require('./subscribe');
const wsConnector = require('./wsConnector');
const user = require('./user');
const debug = require('./debug');
const persist = require('./persist');
const scripts = require('./scripts');
const gc = require('./gc');
const evtTables = require('./evtTables');
const funcOr = require("./util.js").funcOr;

const serverID = config.serverID;

//main app
module.exports = () => {

    const engine = new Engine();

    if (config.persist)
        persist(engine);
    evtTables.evtTable(engine);
    obj(engine);
    subscribe(engine);
    user.middleware(engine);
    scripts(engine);
    wsConnector(engine);
    debug(engine);
    gc(engine);

    engine.once(['serverExit', serverID, serverID], () => setTimeout(process.exit, config.exitDelay));
    const h=funcOr(() => engine.emit(['serverExit', serverID, '*']), 5, true);
    process.once('exit', h[0]);
    process.once('SIGINT', h[1]);
    process.once('SIGUSR1', h[2]);
    process.once('SIGUSR2', h[3]);
    // process.once('uncaughtException', () => engine.emit(['server_exit', serverID, '*']));

    engine.emit(["serverInit", serverID, serverID]);

    console.log("Server is running");
};