//this will block/accept events depending on user
//todo make rules serializable
const config = require('./config');

module.exports.evtTable = (engine) => {
    const handler = (state, next, payload, evt) => {
        if (!Array.isArray(state.evtRules))
            state.evtRules = config.defaultEvtRules;

        for (let i = 0; i < state.evtRules.length; i++) {
            const evtRule = state.evtRules[i];
            const res = evtRule.match(evt, payload, state);
            if (res) {
                let action = evtRule.action;
                if (action === 'custom')
                    action = res;
                if (action === 'accept') next(state);
                if (action === 'reject')return;
            }
        }
    };

    engine.onM(['*', '*', '*'], handler);
    engine.onM(['*', '*', '*', config.pathMarker, '**'], handler);
};