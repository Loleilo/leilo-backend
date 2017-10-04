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
const evtTables=require('./evtTables');

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

    engine.once(['serverExit', serverID, serverID], () => process.exit());
    process.once('exit', () => engine.emit(['serverExit', serverID, '*']));
    process.once('SIGINT', () => engine.emit(['serverExit', serverID, '*']));
    process.once('SIGUSR1', () => engine.emit(['serverExit', serverID, '*']));
    process.once('SIGUSR2', () => engine.emit(['serverExit', serverID, '*']));
    // process.once('uncaughtException', () => engine.emit(['server_exit', serverID, '*']));

    engine.emit(["serverInit", serverID, serverID]);

    console.log("Server is running");
};