const JSON = require('circular-json');
const pathMarker = require("../defaultConfig.js").sharedConsts.pathMarker;
require('longjohn');
require('colors');
module.exports = (engine, config) => {
    const debugLevel = config.debugLevel;
    const debugHandler = (state, next, payload, evt) => {
        const color = evt.name === 'error' || evt.name === 'warning' ? 'red' : 'yellow';
        if (debugLevel === 'short') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path)[color]
            );
        } else if (debugLevel === 'normal') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path
                + '\n' + ' payload:' + JSON.stringify(payload))[color]
            );
        } else if (debugLevel === 'verbose') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path
                + '\n' + ' payload:' + JSON.stringify(payload)
                + '\n' + ' state:' + JSON.stringify(state))[color]
            );
        }
        if (color === 'red')
            console.log((payload.err.message + " Stack trace:\n" + payload.err.stack).red);
        next(state);
    };
    engine.onM(['*', '*', '*'], debugHandler);
    engine.onM(['*', '*', '*', pathMarker, '**'], debugHandler);
};