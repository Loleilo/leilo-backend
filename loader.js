const Engine = require('./engine');
const defaultConfig = require('./defaultConfig');

const util = require("./util.js");
const merge = require("lodash/merge");
const d = util.getDefault;

//main modules
module.exports = (config = {}) => {

    //todo move default logic out of this module
    let sharedConsts = defaultConfig.sharedConsts;
    let serverConfig = Object.assign({}, defaultConfig.localConfig, d(config.localConfig, {}));
    let globalConfig = Object.assign({}, sharedConsts, serverConfig);

    let modules = merge({}, defaultConfig.modules, config.modules);
    let moduleOrder = d(defaultConfig.moduleOrder, config.moduleOrder);

    const engine = new Engine(globalConfig);

    for (let i = 0; i < moduleOrder.length; i++) {
        const module = modules[moduleOrder[i]];
        const config = Object.assign({}, globalConfig, module);

        let enabled = false;
        if (config.enable === "ALWAYS")
            enabled = true;
        else if (config.enable === "DEVELOPMENT" && process.env.NODE_ENV !== 'production')
            enabled = true;
        else if (config.enable === "PRODUCTION" && process.env.NODE_ENV === 'production')
            enabled = true;

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

    return {
        engine: engine,
        sharedConfig: sharedConsts,
        localConfig: serverConfig,
        globalConfig: globalConfig,
        modules: modules,
        moduleOrder: moduleOrder,
    };
};