const sioc = require('socket.io-client');
const funcOr = require("../_leilo-backend/util.js").funcOr;
const waitAll = require("../_leilo-backend/util.js").funcAnd;
const serverID = require("../consts").serverID;
const fs = require('fs');
require('colors');
require('../index')();

const testScript = fs.readFileSync('./testScript.js').toString();
const ws = sioc('http://127.0.0.1:80');
const ws2 = sioc('http://127.0.0.1:80');
const ws3 = sioc('http://127.0.0.1:80');

// const emt2 = new EventEmitter2();
// const emt3 = new EventEmitter2();

const s1 = (js, callback) => {
    ws.emit('message', JSON.stringify(js), callback);
};
const s2 = (js, callback) => {
    console.log(('< ' + JSON.stringify(js)).underline.blue);
    ws2.emit('message', JSON.stringify(js), callback);
};
const s3 = (js, callback) => {
    console.log(('< ' + JSON.stringify(js)).underline.green);
    ws3.emit('message', JSON.stringify(js), callback);
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
                name: "requestResponse",
                dst: '*',
            },
            payload: {
                firstReqID: 'req1',
                responseLst: ["accept", "reject", "skip"],
            },
        });
    }, 100);
    setTimeout(() => {
        s3({
            evt: {
                name: "requestResponse",
                dst: '*',
            },
            payload: {
                firstReqID: 'req4',
                responseLst: ["accept", 'accept'],
            },
        });
    }, 200);
    setTimeout(() => {
        s3({
            evt: {
                name: "update",
                dst: 'leilo',
                path: ['users', 'sunny', 'stuff'],
            },
            payload: {
                value: 209875943
            },
        });
    }, 300);
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
    }, () => console.log('ack callback called'));

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
    setTimeout(() => {
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
        setTimeout(() => {
            s3({
                username: 'sunny',
                password: 'pass'
            });

            scriptTest();
        }, 100);
    }, 100);
};

const wrapped = waitAll(openHandler, 3);

ws.on('connect', wrapped[0]);
ws2.on('connect', wrapped[1]);
ws3.on('connect', wrapped[2]);

ws3.on('message', (msg) => {
    console.log(('> ' + msg).green);
    // msg = JSON.parse(msg);
    // emt2.emit(toArr(msg.evt), msg.payload);
});
ws2.on('message', (msg) => {
    console.log(('> ' + msg).blue);
    // msg = JSON.parse(msg);
    // emt3.emit(toArr(msg.evt), msg.payload);
});