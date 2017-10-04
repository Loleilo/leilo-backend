module.exports.ALL = () => {
    return true;
};

module.exports.NONE = () => {
    return false;
};

module.exports.userLevel = (baseMatch, lvl, mode = "===") => {
    return (evt, payload, state) => {
        if (!baseMatch(evt, payload, state))return false;

        const uLvl = state.readUserLevel(state, evt.src);
        if (mode === '===')
            return uLvl === lvl;
        if (mode === '<')
            return uLvl < lvl;
        if (mode === '>')
            return uLvl > lvl;
        if (mode === '<=')
            return uLvl <= lvl;
        if (mode === '>=')
            return uLvl >= lvl;
    };
};

module.exports.evtName = (baseMatch, evtName, not = false) => {
    return (evt, payload, state) => {
        if (!baseMatch(evt, payload, state))return false;

        if (not)
            return evt.name !== evtName;
        else
            return evt.name === evtName;
    };
};
