//handles a client websocket connection
module.exports = (on) => {
    on(['*', '*', '*'], (state, next, payload, engine, src, dst, evt) => {
        console.log("Event occurred:", evt, '\n',
            ' path: ', src, '->', dst, '\n',
            ' payload:', payload, '\n',
            ' state:', state
        );
        next(state);
    });
};