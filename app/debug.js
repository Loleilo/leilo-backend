const debugLevel=require('./config').debugLevel;
const JSON = require('circular-json');
//handles a client websocket connection
require('colors');
module.exports = (on) => {
    on(['*', '*', '*', '**'], (state, next, payload, engine, evt) => {
        const color=evt.name==='errorOccurred'?'red':'yellow';
        if(debugLevel==='none')
            next(state);
        else if(debugLevel==='short'){
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path)[color]
            );
        }else if(debugLevel==='normal') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path
                + '\n' + ' payload:' + payload
                + '\n' + ' state:' + state)[color]
            );
        }else if(debugLevel==='verbose') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path
                + '\n' + ' payload:' + JSON.stringify(payload)
                + '\n' + ' state:' + JSON.stringify(state))[color]
            );
        }
        if(color==='red')
            console.log(payload.err.message.red);
        next(state);
    });
};