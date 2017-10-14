const Engine = require('./modules/engine');
const defaultConfig = require('./defaultConfig');

const util = require("./modules/util.js");
const funcOr = util.funcOr;
const d = util.getDefault;

//main modules
module.exports = (_config = {}) => {

    let sharedConfig = Object.assign({}, defaultConfig.sharedConsts, d(_config.sharedConsts, {}));
    let serverConfig = Object.assign({}, defaultConfig.serverConfig, d(_config.serverConfig, {}));
    let globalConfig = Object.assign({}, sharedConfig, serverConfig);

    let modules = d(_config.modules, defaultConfig.modules);

    const serverID = globalConfig.serverID;

    const engine = new Engine(globalConfig);

    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const config = Object.assign({}, globalConfig, module);

        let enabled = false;
        if (config.enable === "ALWAYS")
            enabled = true;
        else if (config.enable === "DEV" && process.env.NODE_ENV !== 'production')
            enabled = true;
        else if(config.enable==="PRODUCTION" && process.env.NODE_ENV === 'production')
            enabled=true;

        if (enabled === true) {
            let moduleName = module.__moduleName;
            let moduleActual;
            if (moduleName.funcName === undefined)
                moduleActual = require("./modules/" + moduleName);
            else
                moduleActual = require("./modules/" + moduleName.fileName)[moduleName.funcName];

            moduleActual(engine, config);
        }
    }

    engine.once(['serverExit', serverID, serverID], () => setTimeout(process.exit, defaultConfig.exitDelay));
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