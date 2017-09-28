let abind = require("auto-bind");
let d = require('./util').getDefault;

const defaultOptions = {
    scopedEvents: ['update', 'updatePerms', 'create', 'delete'],
    scope: [], //todo think about wildcard in scope
};

class SandboxError extends Error {

}

module.exports.SandboxError = SandboxError;

class Sandbox {
    constructor(engine, userID, options) {
        this.options = Object.assign(defaultOptions, options);
        this.disabled = false;
        this.interface = {
            emit: this.applySandbox(
                (evt, scope, payload) => engine.emit([evt.name, userID, evt.dst, ...scope, ...d(evt.path, [])], payload)),

            on: this.applySandbox((evt, scope, callback) => {
                const wrapper = (payload, evtInner) => {
                    if (this.disabled)return; //dont pass call if disabled
                    callback(payload, {
                        //rewrite path info to scope
                        name: evtInner.name,
                        src: evtInner.src,
                        dst: userID,
                        path: evtInner.path.slice(scope.length)
                    });
                };
                const evtArr = [evt.name, evt.src, userID, ...scope, ...d(evt.path, [])];
                engine.on(evtArr, wrapper);
                return wrapper; //returns so that script can removeListener
            }),

            once: this.applySandbox((evt, scope, callback) => {
                const wrapper = (payload, evtInner) => {
                    if (this.disabled)return; //dont pass call if disabled
                    callback(payload, {
                        //rewrite path info to scope
                        name: evtInner.name,
                        src: evtInner.src,
                        dst: userID,
                        path: evtInner.path.slice(scope.length)
                    });
                };
                const evtArr = [evt.name, evt.src, userID, ...scope, ...d(evt.path, [])];
                engine.once(evtArr, wrapper);
                return wrapper;
            }),

            removeListener: this.applySandbox((evt, scope, callback) => {
                engine.removeListener([evt.name, evt.src, userID, ...scope, ...d(evt.path, [])], callback);
            })

            //NOTE: removeAllListeners is not allowed, because it may remove other users' listeners as well
        };

        abind(this);
    }

    applySandbox(func) {
        return (evt, ...args) => {
            if (this.disabled)throw new SandboxError('Interface has been disabled');

            let scope = [];
            if (this.options.scopedEvents.includes(evt.name))
                scope = this.options.scope;

            func(evt, scope, ...args);
        };
    }

    disable() {
        this.disabled = true;
    }
}

module.exports.SandBox = Sandbox;