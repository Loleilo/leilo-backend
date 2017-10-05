const Engine = require('./modules/engine');
const config = require('./modules/config');

const obj = require('./modules/obj');
const subscribe = require('./modules/subscribe');
const wsConnector = require('./modules/wsConnector');
const user = require('./modules/user');
const persist = require('./modules/persist');
const scripts = require('./modules/scripts');
const gc = require('./modules/gc');
const evtTables = require('./modules/evtTables');
const funcOr = require("./modules/util.js").funcOr;

const serverID = config.serverID;

//main modules
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
    if (config.debugLevel !== 'none')
        require('./modules/debug')(engine);
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

if (require.main === module) {
    module.exports();
}