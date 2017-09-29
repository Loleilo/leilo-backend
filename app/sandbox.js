const abind = require("auto-bind");
const pathed = require("./pathed.js");
const a = Object.assign;

const defaultOptions = {
    scope: [], //todo think about wildcard in scope
    allowRemoveAllListeners: false,
    forceSrc: true,
    forceDst: true,
};

class SandboxError extends Error {
}
module.exports.SandboxError = SandboxError;

class Sandbox {
    constructor(engine, userID, options = {}) {
        abind(this);

        this.options = Object.assign(defaultOptions, options);
        this._userID = userID;
        this._engine = engine;

        this.disabled = false;

        //expose wrapped functions in single interface
        this.interface = {
            emit: this._sandboxify(this._emit),
            on: this._sandboxify(this._on),
            once: this._sandboxify(this._once),
            removeListener: this._sandboxify(this._removeListener),
        };

        if (options.allowRemoveAllListeners)
            this.removeAllListeners = this._sandboxify(this._removeAllListeners);
    }

    //wraps a function with some checks
    _sandboxify(func) {
        return ( ...args) => {
            if (this.disabled)
                throw new SandboxError('Interface disabled');
            return func(...args);
        };
    }


    //these two functions convert between events inside scope, and events outside scope

    _scopeSrc(evt) {
        if (pathed.evtType(evt) === 'pathed')
            evt.path = evt.path.slice(this.options.length);
        return evt;
    }

    _scopeDst(evt) {
        const type = pathed.evtType(evt);
        if (type === 'invalid')throw new SandboxError("Invalid event");
        if (type === 'pathed')
            evt.path = this.options.scope.concat(evt.path);
        return pathed.toArr(evt);
    }

    //scoped emit and on functions

    _emit(evt, payload) {
        if (this.options.forceSrc) evt = a(evt, {
            src: this._userID // force src to be this user
        });
        this._engine.emit(this._scopeDst(evt), payload);
    }

    _on(evt, callback) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        const wrapped = (payload, evtInner) => callback(payload, this._scopeSrc((evtInner)));
        this._engine.on(this._scopeDst(evt), wrapped);
        return wrapped; //for client to use if they want to remove
    }

    _once(evt, callback) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        const wrapped = (payload, evtInner) => callback(payload, this._scopeSrc((evtInner)));
        this._engine.once(this._scopeDst(evt), wrapped);
        return wrapped; //for client to use if they want to remove
    }

    _removeListener(evt, callback) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        this._engine.removeListener(this._scopeDst(evt), callback);
    }

    _removeAllListeners(evt) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        this._engine.removeAllListeners(this._scopeDst(evt));
    }
}

module.exports.Sandbox = Sandbox;