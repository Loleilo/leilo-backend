//handles a client websocket connection
module.exports = (on) => {
    on(['*', '*', '*', '**'], (state, next, payload, engine, evt) => {
        console.log("Event occurred:", evt.name, '\n',
            ' path: ', evt.src, '->', evt.dst, '\n',
            ' params: ', evt.params, '\n',
            ' payload:', payload, '\n',
            ' state:', state
        );
        next(state);
    });
};