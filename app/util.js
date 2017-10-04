module.exports.getDefault = (obj, defaultVal) => obj === undefined ? defaultVal : obj;

module.exports.funcAnd = (callback, n) => {
    const arr = [];
    const res = [];
    for (let i = 0; i < n; i++) {
        res[i] = (...args) => {
            arr[i] = true;
            for (let j = 0; j < n; j++)
                if (!arr[j])return;
            callback(...args);
        };
    }
    return res;
};

module.exports.funcOr = (callback, n, once = false) => {
    const res = [];
    let called = false;
    let _callback = callback;
    if (once) {
        _callback = (...args) => {

            if (called)return;
            called = true;
            callback(...args);
        };
    }
    for (let i = 0; i < n; i++) {
        res[i] = _callback;
    }
    return res;
};