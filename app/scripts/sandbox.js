const defaultOptions = {
    scopedEvents: ['update', 'updatePerms', 'create', 'delete'],
    scope: [], //todo think about wildcard in scope
};

class SandboxError extends Error {

}

module.exports.SandboxError = SandboxError;

module.exports.createSandbox = (engine, userID, options) => {
    return {
        disabled: false,

        //list of listeners made by script, used to remove on disposal
        _registeredListeners: [], //NOTE: listeners removed by client will remain in list

        applySandbox(func){
            return (evt, ...args) => {
                if (this.disabled)throw new SandboxError('Interface has been disabled');

                let scope = [];
                if (options.scopedEvents.includes(evt.name))
                    scope = options.scope;

                func(evt, scope, ...args);
            };
        },

        interface: {
            emit: applySandbox(
                (evt, scope, payload) => engine.emit([evt.name, userID, evt.dst, ...scope, ...d(evt.params, [])], payload)),

            on: applySandbox((evt, scope, callback) => {
                const wrapper = (payload, evtInner) => {
                    callback(payload, {
                        //rewrite path info to scope
                        name: evtInner.name,
                        src: evtInner.src,
                        dst: userID,
                        params: evtInner.params.slice(scope.length)
                    });
                };
                const evtArr = [evt.name, evt.src, userID, ...scope, ...d(evt.params, [])];
                engine.on(evtArr, wrapper);
                this._registeredListeners.push([evtArr, wrapper]);
                return wrapper; //returns so that script can removeListener
            }),

            once: applySandbox((evt, scope, callback) => {
                const wrapper = (payload, evtInner) => {
                    callback(payload, {
                        //rewrite path info to scope
                        name: evtInner.name,
                        src: evtInner.src,
                        dst: userID,
                        params: evtInner.params.slice(scope.length)
                    });
                };
                const evtArr = [evt.name, evt.src, userID, ...scope, ...d(evt.params, [])];
                engine.once(evtArr, wrapper);
                this._registeredListeners.push([evtArr, wrapper]);
                return wrapper;
            }),

            removeListener: applySandbox((evt, scope, callback) => {
                engine.removeListener([evt.name, evt.src, userID, ...scope, ...d(evt.params, [])], callback);
            })

            //NOTE: removeAllListeners is not allowed, because it may remove other users' listeners as well
        },

        disable(){
            this.disabled = true;

            //remove all listeners set by script
            for (let i = 0; i < this._registeredListeners; i++) {
                const pair = this._registeredListeners[i];
                engine.removeListener(pair[0], pair[1]);
            }
        }
    };
};