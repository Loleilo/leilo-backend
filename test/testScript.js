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
            name: 'gudcontent'+payload
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req1'],
        dst: 'leilo',
    }, {
        evt:{
            name: "do req 1",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req2'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent2'+payload
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req2'],
        dst: 'leilo',
    }, {
        evt:{
            name: "do req 2",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req3'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent3'+payload
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req3'],
        dst: 'leilo',
    }, {
        evt:{
            name: "do req 3",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req4'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent4'+payload
        });
        emit({
            name: 'initDone'
        });
    });
    emit({
        name: 'requestElevated',
        path: ['req4'],
        dst: 'leilo',
    }, {
        evt:{
            name: "do req 4",
        },
    });
});
emit({
    name: 'yay1'
});