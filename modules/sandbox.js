const abind = require("auto-bind");
const pathed = require("./pathed.js");
const a = Object.assign;

const defaultOptions = {
    allowRemoveAllListeners: false,
    forceSendIdentity: true,
    forceReceiveIdentity: true,
};

class SandboxError extends Error {
}
module.exports.SandboxError = SandboxError;

const _scopeDst = (evt) => {
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

        try {
            //expose wrapped functions in single interface
            this.interface = {
                emit: this._sandboxify(this._emit, "src"),
                on: this._sandboxify(this._on),
                once: this._sandboxify(this._once),
                removeListener: this._sandboxify(this._removeListener),
            };
        } catch (e) {
            console.log(e);
        }

        if (options.allowRemoveAllListeners)
            this.removeAllListeners = this._sandboxify(this._removeAllListeners);
    }

    //wraps a function with some checks
    _sandboxify(func, dir = "dst") {
        return (evt, ...args) => {
            if (this.disabled)
                throw new SandboxError('Interface disabled');
            if (dir === 'src')
                if (this.options.forceSendIdentity) evt = a(evt, {
                    src: this._userID // force src to be this user
                });
            if (dir === "dst")
                if (this.options.forceReceiveIdentity) evt = a(evt, {
                    dst: this._userID // force dst to be this user
                });
            return func(_scopeDst(evt), ...args);
        };
    }

    //scoped emit and on functions todo idk why this is needed (causes error if not used)

    _emit(evt, payload) {
        this._engine.emitNext(evt, payload);
    }

    _on(evt, callback) {
        this._engine.on(evt, callback);
    }

    _once(evt, callback) {
        this._engine.once(evt, callback);
    }

    _removeListener(evt, callback) {
        this._engine.removeListener(evt, callback);
    }

    _removeAllListeners(evt) {
        this._engine.removeAllListeners(evt);
    }
}

module.exports.Sandbox = Sandbox;