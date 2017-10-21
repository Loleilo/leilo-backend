const consts = require('../../consts');
const Sandbox = require("../Sandbox.js").Sandbox;
const serverID = consts.serverID;

module.exports = (engine) => {
    let sandboxes = {};

    const initSandbox = (evt) => {
        if (!sandboxes[evt.src]) {
            sandboxes[evt.src] = new Sandbox(engine);
            engine.emit({name: 'authProxy', src: serverID, dst: evt.src}, evt.src);
        }
    };

    engine.on({name: 'authProxy', src: serverID, dst: '*'}, (payload, evt) => {
        sandboxes[evt.dst].options.allowedReceiveIdentities[payload] = true;
        sandboxes[evt.dst].options.allowedSendIdentities[payload] = true;
    });

    engine.on({name: 'proxy', dst: serverID}, (payload, evt) => {
        initSandbox(evt);
        payload(sandboxes[evt.src].interface);
    });
};