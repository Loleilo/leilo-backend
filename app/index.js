const Engine = require('./engine');
const config = require('./config');

const obj = require('./obj');
const subscribe = require('./subscribe');
const wsConnector = require('./wsConnector');
const user = require('./user');
const debug = require('./debug');
const persist = require('./persist');
const scripts=require('./scripts');

const serverID = config.serverID;

//main app
module.exports = () => {

    const engine = new Engine();

    engine.use(persist);
    engine.use(obj);
    engine.use(subscribe);
    engine.use(scripts);
    engine.use(user);
    engine.use(wsConnector);
    engine.use(debug);

    engine.once(['server_exit', serverID, serverID], () => process.exit());
    process.once('exit', () => engine.emit(['server_exit', serverID, '*']));
    process.once('SIGINT', () => engine.emit(['server_exit', serverID, '*']));
    process.once('SIGUSR1', () => engine.emit(['server_exit', serverID, '*']));
    process.once('SIGUSR2', () => engine.emit(['server_exit', serverID, '*']));
    // process.once('uncaughtException', () => engine.emit(['server_exit', serverID, '*']));

    engine.emit(["server_init", serverID, serverID]);

    console.log("Server is running");
};