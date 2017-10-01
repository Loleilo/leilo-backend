//EventEmitter2 - allows wildcard events and namespacing
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const EventEmitterChain2 = require('eventemitterchain2').EventEmitterChain2;
const config = require('./config');
let toObj = require("./pathed").toObj;
const serverID = config.serverID;
const abind = require('auto-bind');
const evtType = require("./pathed.js").evtType;

const defaultConf = {
    wildcard: true, //enable wildcards in event name
    maxListeners: config.engineMaxListeners,
};

//Handles state change events and allows for middleware (aka functions that may modify events as they are passed down)
//Adds some syntactic sugar to make middleware easy
//Also allows cancel, emit, etc. nice functions (cancel is only for middleware)
class Engine extends EventEmitter2 {
    constructor(initState = {}) {
        super(defaultConf);
        abind(this);

        this.state = initState;

        // const actualSuper = super;
        //handles events for middleware (aka before actual event is run)
        this.pendingEmitter = new EventEmitterChain2(defaultConf, (...args) => super.emit(...args));
    }

    _createHandler(callback) {
        return (next, payload, evt) => {
            try {
                callback(
                    this.state,
                    //wrap next function with a nextState parameter that allows middleware to modify state
                    (nextState) => {
                        this.state = nextState;
                        next();
                    },
                    payload,
                    this,
                    evt
                )
            } catch (err) {
                console.log(err);
                this.emit(['error_occurred', serverID, evt.src], {
                    err: err,
                    srcEvent: evt
                });
            }
        };
    }

    //registers a callback into the middleware chain
    _onPending(evt, callback) {
        this.pendingEmitter.on(evt, this._createHandler(callback))
    };

    _oncePending(evt, callback) {
        this.pendingEmitter.once(evt, this._createHandler(callback))
    }

    //allows a middleware to register event callbacks
    //middleware should follow interface (on)=>{...}
    //callback passed on should follow interface (state, next, payload, emit, src, dst)=>{...}
    use(middleware) {
        //allow middleware to initialize with the on object
        middleware(this._onPending, this._oncePending);
    }

    emit(evt, payload) {
        //ignore internal events
        if (evt === 'newListener' || evt==='removeListener')return;

        if (!Array.isArray(evt) || evtType(evt) === 'invalid') {
            this.emit(['error_occurred', serverID, serverID], {
                err: new Error('Invalid event'),
                srcEvt: evt,
            });
            return;
        }

        const defaultParams = [undefined, '*', '*'];
        for (let i = 0; i < defaultParams.length; i++)
            if (evt[i] === undefined)
                evt[i] = defaultParams[i];

        this.pendingEmitter.emit(evt, payload, toObj(evt));
    }

    emitAsync(...args) {
        process.nextTick(() => this.emit(...args))
    }
}

module.exports = Engine;