const debugLevel = require('./config').debugLevel;
const JSON = require('circular-json');
//handles a client websocket connection
require('colors');
module.exports = (engine) => {
    engine.onM(['*', '*', '*', '**'], (state, next, payload, evt) => {
        if (debugLevel === 'none')
            return;
        const color = evt.name === 'errorOccurred' ? 'red' : 'yellow';
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
    });
};