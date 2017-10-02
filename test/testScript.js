on({
    name: 'initRun',
    src: '*'
}, () => {
    once({
        name: 'requestResponse',
        path: ['req1'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent' + payload
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req1'],
        dst: 'leilo',
    }, {
        evt: {
            name: "do req 1",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req2'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent2' + payload
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req2'],
        dst: 'leilo',
    }, {
        evt: {
            name: "do req 2",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req3'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent3' + payload
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req3'],
        dst: 'leilo',
    }, {
        evt: {
            name: "do req 3",
        },
    });
    emit({
        name: 'requestElevated',
        path: ['req4'],
        dst: 'leilo',
    }, {
        evt: {
            name: "create",
            path: ['users', 'sunny'],
            dst: 'leilo',
        },
        payload: {
            newObjName: 'stuff',
            newObjVal: 10,
        }
    });
    once({
        name: 'requestResponse',
        path: ['req5'],
        src: 'leilo',
    }, () => {
        emit({
            name: 'requests done'
        });
        on({
            name: 'update',
            path: ['users', 'sunny', 'stuff'],
            src: "*"
        }, (payload) => {
            emit({
                name: "update detected val=" + payload.value
            });
        });
        emit({
            name: 'subscribe',
            dst: 'leilo',
            path: ['users', 'sunny', 'stuff']
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req5'],
        dst: 'leilo',
    }, {
        evt: {
            name: "updatePerms",
            path: ['users', 'sunny', 'stuff'],
            dst: 'leilo',
        },
        payload: {
            user: scriptID,
            perms: {lvl: 3}
        }
    });
});
emit({
    name: 'yay1'
});