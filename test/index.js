const WebSocket = require('ws');
const funcOr = require("../app/util.js").funcOr;
const waitAll = require("../app/util.js").funcAnd;
const serverID = require("../app/config.js").serverID;
const fs = require('fs');
// const EventEmitter2 = require('eventemitter2');
require('colors');
require('../index');
// const toArr = require("../app/pathed.js").toArr;

const testScript = fs.readFileSync('./testScript.js').toString();
const ws = new WebSocket('ws://localhost:80');
const ws2 = new WebSocket('ws://localhost:80');
const ws3 = new WebSocket('ws://localhost:80');

// const emt2 = new EventEmitter2();
// const emt3 = new EventEmitter2();

const s1 = (js) => {
    ws.send(JSON.stringify(js));
};
const s2 = (js) => {
    ws2.send(JSON.stringify(js));
};
const s3 = (js) => {
    ws3.send(JSON.stringify(js));
};

const scriptTest = () => {
    s3({
        evt: {
            name: "instantiateScript",
            dst: serverID,
        },
        payload: {
            scriptCode: testScript,
            sandboxOptions: {}
        }
    });
    setTimeout(() => {
        s3({
            evt: {
                name: "requestAccepted",
                dst: '*',
            },
            payload: {
                firstReqID: 'req1',
                responseLst: ["accept"],
            },
        });
    }, 500);
};

const openHandler = () => {
    s1({
        username: 'leilo',
        password: 'pass',
    });

    s1({
        evt: {
            name: 'createUser',
            dst: serverID,
        },
        payload: {
            username: 'root',
            password: 'pass'
        }
    });

    s1({
        evt: {
            name: 'updateUserLevel',
            dst: serverID,
        },
        payload: {
            user: 'root',
            level: 0,
        }
    });

    s2({
        username: 'root',
        password: 'pass'
    });

    s2({
        evt: {
            name: 'createUser',
            dst: serverID,
        },
        payload: {
            username: 'sunny',
            password: 'pass'
        }
    });

    s3({
        username: 'sunny',
        password: 'pass'
    });

    scriptTest();

};

const wrapped = waitAll(openHandler, 3);

ws.on('open', wrapped[0]);
ws2.on('open', wrapped[1]);
ws3.on('open', wrapped[2]);

ws3.on('message', (msg) => {
    console.log(msg.green);
    // msg = JSON.parse(msg);
    // emt2.emit(toArr(msg.evt), msg.payload);
});
ws2.on('message', (msg) => {
    console.log(msg.blue);
    // msg = JSON.parse(msg);
    // emt3.emit(toArr(msg.evt), msg.payload);
});