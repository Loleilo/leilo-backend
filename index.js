const defaultConfig = require('./_leilo-backend/defaultConfig');

const util = require("./_leilo-backend/util.js");
const funcOr = util.funcOr;

const load = require('./_leilo-backend/loader');

//main modules
module.exports = (config = {}) => {

    const loaded = load(config);
    const engine = loaded.engine;
    const globalConfig = loaded.globalConfig;

    const serverID = globalConfig.serverID;

    engine.once(['serverExit', serverID, serverID], () => setTimeout(process.exit, globalConfig.exitDelay));
    const h = funcOr(() => engine.emit(['serverExit', serverID, '*']), 5, true);
    process.once('exit', h[0]);
    process.once('SIGINT', h[1]);
    process.once('SIGUSR1', h[2]);
    process.once('SIGUSR2', h[3]);
    // process.once('uncaughtException', () => engine.emit(['server_exit', serverID, '*']));

    engine.emit(["serverInit", serverID, serverID]);
};

if (require.main === module) {
    module.exports();
}