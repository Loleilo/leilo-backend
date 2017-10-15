const pathMarker = require('./consts').pathMarker;
let d = require('./_leilo-backend/util').getDefault;

module.exports.evtType = (evt) => {
    if (Array.isArray(evt)) {
        if (evt[0] === '**' || evt[1] === '**' || evt[2] === '**')return "invalid";
        if (evt.length > 3) {
            if (evt[3] === pathMarker)return "pathed";
            return "invalid";
        }
        return "unpathed";
    }
    if (evt.name === '**' || evt.src === '**' || evt.dst === '**')return "invalid";
    if (evt.name === undefined)return "invalid";
    return evt.path === undefined ? "unpathed" : "pathed";
};

module.exports.toArr = (evtObj) => {
    let path = [];
    if (evtObj.path)
        path = [pathMarker].concat(evtObj.path);
    return [evtObj.name, evtObj.src, evtObj.dst, ...path];
};

module.exports.toObj = (evtArr) => {
    return {
        name: evtArr[0],
        src: evtArr[1],
        dst: evtArr[2],
        path: evtArr[3] === pathMarker ? evtArr.slice(4) : undefined
    };
};

module.exports.pathedEvents = ['update', 'updatePerms', 'create', 'delete'];