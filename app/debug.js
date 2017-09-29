//handles a client websocket connection
module.exports = (on) => {
    on(['*', '*', '*', '**'], (state, next, payload, engine, evt) => {
        console.log("Event occurred:", evt.name, '\n'
            , ' direction: ', evt.src, '->', evt.dst, '\n'
            , ' path: ', evt.path, '\n'
            // , ' payload:', payload, '\n'
            // , ' state:', state
        );
        next(state);
    });
};