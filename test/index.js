require('../');
const WebSocket = require('ws');
const serverID = require("../app/config.js").serverID;

const ws = new WebSocket('ws://localhost:80');

ws.on('open', function open() {
    //login
    ws.send(JSON.stringify({
        username: 'leilo',
        password: 'pass',
    }));

    ws.send(JSON.stringify({
        evt: {
            name: "instantiate_script",
            dst: serverID,
        },
        payload:{
            scriptCode: `
            on({
                name: 'init_run',
                src: '*'
            }, ()=>{
                emit({
                    name: 'init_done'
                });
            });
             emit({
                    name: 'yay1'
             });
            `
        }
    }));
});

ws.on('message', (msg) => console.log(msg));