const WebSocket = require('ws');
const funcOr = require("../app/util.js").funcOr;
const waitAll = require("../app/util.js").funcAnd;
const serverID = require("../app/config.js").serverID;
const fs = require('fs');
require('colors');

const testscript = fs.readFileSync('./testscript.js').toString();
require('../index');
const ws = new WebSocket('ws://localhost:80');
const ws2 = new WebSocket('ws://localhost:80');

const s1 = (js) => {
    ws.send(JSON.stringify(js));
};

const s2 = (js) => {
    ws2.send(JSON.stringify(js));
};

const scriptTest = () => {
    s2({
        evt: {
            name: "instantiate_script",
            dst: serverID,
        },
        payload: {
            scriptCode: testscript,
            sandboxOptions: {
            }
        }
    });
};

const openHandler = () => {
    s1({
        username: 'leilo',
        password: 'pass',
    });

    s1({
        evt: {
            name: 'create_user'
        },
        payload: {
            username: 'sunny',
            password: 'pass'
        }
    });

    s2({
        username: 'sunny',
        password: 'pass'
    });

    scriptTest();

};

const wrapped = waitAll(openHandler, 2);

ws.on('open', wrapped[0]);
ws2.on('open', wrapped[1]);

ws.on('message', (msg) => console.log(msg.green));
ws2.on('message', (msg) => console.log(msg.blue));