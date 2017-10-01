module.exports.getDefault = (obj, defaultVal) => obj === undefined ? defaultVal : obj;

module.exports.funcAnd = (callback, n) => {
    const arr = [];
    const res = [];
    for (let i = 0; i < n; i++) {
        res[i] = (...args) => {
            arr[i] = true;
            for (let j = 0; j < n; j++)
                if (!arr[j])return;
            callback();
        };
    }
    return res;
};

module.exports.funcOr=(callback, n)=>{
    const res = [];
    for (let i = 0; i < n; i++) {
        res[i] = (...args) => callback(...args);
    }
    return res;
};