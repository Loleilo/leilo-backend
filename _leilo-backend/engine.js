//EventEmitter2 - allows wildcard events and namespacing
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const EventEmitterChain2 = require('eventemitterchain2').EventEmitterChain2;
const abind = require('auto-bind');
const pathed = require('../pathed');
const consts = require('../consts');
const serverID = consts.serverID;

//Handles state change events and allows for middleware (aka functions that may modify events as they are passed down)
//Adds some syntactic sugar to make middleware easy
//Also allows cancel, emit, etc. nice functions (cancel is only for middleware)
class Engine extends EventEmitter2 {
    constructor(config) {
        super(config.engine);
        abind(this);

        this.state = config.engine.initState;
        this.config = config;

        // const actualSuper = super;
        //handles events for middleware (aka before actual event is run)
        //todo super is not bound properly
        this.pendingEmitter = new EventEmitterChain2(config.engine, (...args) => super.emit(...args));
    }

    _createHandler(callback) {
        return (next, payload, evt, callbackInner) => {
            try {
                callback(
                    this.state,
                    //wrap next function with a nextState parameter that allows middleware to modify state
                    (nextState) => {
                        this.state = nextState;
                        next();
                    },
                    payload,
                    evt,
                    callbackInner
                )
            } catch (err) {
                this.emit(['error', serverID, evt.src], {
                    err: err,
                    srcEvent: evt
                });
            }
        };
    }

    _checkInvalid(evt, defaultParams = this.config.engine.defaultEvt) {
        if (pathed.evtType(evt) === 'invalid') {
            this.emit(['error', serverID, serverID], {
                err: new Error('Invalid event'),
                srcEvt: evt,
            });
        }

        if (!Array.isArray(evt))
            evt = pathed.toArr(evt);

        for (let i = 0; i < defaultParams.length; i++)
            if (evt[i] === undefined)
                evt[i] = defaultParams[i];

        return evt;
    }

    //registers a callback into the middleware chain
    onM(evt, callback) {
        evt = this._checkInvalid(evt);
        this.pendingEmitter.on(evt, this._createHandler(callback))
    };

    onceM(evt, callback) {
        evt = this._checkInvalid(evt);
        this.pendingEmitter.once(evt, this._createHandler(callback))
    }

    on(evt, ...args) {
        evt = this._checkInvalid(evt);
        super.on(evt, ...args);
    }

    once(evt, ...args) {
        evt = this._checkInvalid(evt);
        super.once(evt, ...args);
    }

    emit(evt, payload, callback) {
        //ignore internal events
        if (evt === 'newListener' || evt === 'removeListener')return;
        evt = this._checkInvalid(evt, this.config.engine.emitDefaultEvt);

        this.pendingEmitter.emit(evt, payload, pathed.toObj(evt), callback);
    }

    emitNext(...args) {
        process.nextTick(() => this.emit(...args))
    }
}

module.exports = Engine;