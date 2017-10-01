const abind = require("auto-bind");
const pathed = require("./pathed.js");
const a = Object.assign;

const defaultOptions = {
    allowRemoveAllListeners: false,
    forceSrc: true,
    forceDst: true,
};

class SandboxError extends Error {
}
module.exports.SandboxError = SandboxError;

const _scopeDst = (evt)=> {
    const type = pathed.evtType(evt);
    if (type === 'invalid')throw new SandboxError("Invalid event");
    return pathed.toArr(evt);
};

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

    //scoped emit and on functions

    _emit(evt, payload) {
        if (this.options.forceSrc) evt = a(evt, {
            src: this._userID // force src to be this user
        });
        this._engine.emit(_scopeDst(evt), payload);
    }

    _on(evt, callback) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        this._engine.on(_scopeDst(evt), callback);
    }

    _once(evt, callback) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        this._engine.once(_scopeDst(evt), callback);
    }

    _removeListener(evt, callback) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        this._engine.removeListener(_scopeDst(evt), callback);
    }

    _removeAllListeners(evt) {
        if (this.options.forceDst) evt = a(evt, {
            dst: this._userID // force dst to be this user
        });
        this._engine.removeAllListeners(_scopeDst(evt));
    }
}

module.exports.Sandbox = Sandbox;