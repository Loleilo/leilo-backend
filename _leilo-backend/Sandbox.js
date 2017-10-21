const abind = require("auto-bind");
const pathed = require("../pathed.js");
const a = Object.assign;

const defaultOptions = {
    allowRemoveAllListeners: false,
    defaultEmitEvt: [undefined, '*', '*'],
};

class SandboxError extends Error {
}
module.exports.SandboxError = SandboxError;

class Sandbox {
    constructor(engine, options = {}) {
        abind(this);

        this.options = {
            allowedSendIdentities: {},
            allowedReceiveIdentities: {},
        };

        this.options = Object.assign({}, defaultOptions, this.options, options);
        this._engine = engine;

        this.disabled = false;

        //expose wrapped functions in single interface
        this.interface = {
            emit: this._sandboxify(this._emit, "src"),
            on: this._sandboxify(this._on),
            once: this._sandboxify(this._once),
            removeListener: this._sandboxify(this._removeListener),
        };

        if (options.allowRemoveAllListeners)
            this.removeAllListeners = this._sandboxify(this._removeAllListeners);
    }

    //wraps a function with some checks
    _sandboxify(func, dir = "dst") {
        return (evt, ...args) => {
            //todo fix this cust
            evt = pathed.toObj(this._engine.checkInvalid(evt, dir === "src" ? this.options.defaultEmitEvt : undefined));

            if (this.disabled)
                throw new SandboxError('Interface disabled');

            if (dir === 'src') {
                const allowed = this.options.allowedSendIdentities;
                if (evt.src === '*') {
                    for (const key in allowed)if (allowed.hasOwnProperty(key)) {
                        evt.src = key;
                        func(evt, ...args);
                    }
                    return;
                }
                if (!allowed[evt.src])
                    throw new SandboxError('Cannot send as ' + evt.src);
            }
            if (dir === "dst") {
                const allowed = this.options.allowedReceiveIdentities;
                if (evt.dst === '*') {
                    for (const key in allowed)if (allowed.hasOwnProperty(key)) {
                        evt.dst = key;
                        func(evt, ...args);
                    }
                    return;
                }
                if (!allowed[evt.dst])
                    throw new SandboxError('Cannot receive as ' + evt.dst);
            }

            func(evt, ...args);
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