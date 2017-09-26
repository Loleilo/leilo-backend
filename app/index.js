const clientHandler = require('./wsConnector');
const Engine = require('./engine');
const config = require('./config');

const obj = require('./obj');
const subscribe=require('./subscribe');
const wsConnector=require('./wsConnector');
const user=require('./user');
const debug=require('./debug');

const serverID=config.serverID;

//main app
module.exports = () => {

    const engine = new Engine();

    engine.use(obj);
    engine.use(subscribe);
    engine.use(user);
    engine.use(wsConnector);
    engine.use(debug);

    engine.emit(["server_init", serverID, serverID]);

    console.log("Server is running");
};