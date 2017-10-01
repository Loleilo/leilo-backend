on({
    name: 'initRun',
    src: '*'
}, () => {
    once({
        name: 'requestResponse',
        path: 'req1',
        src: 'leilo',
    }, () => {
        emit({
            name: 'gudcontent'
        });
        emit({
            name: 'initDone'
        });
    });
    emit({
        name: 'requestElevated',
        path: 'req1',
        dst: 'leilo',
    }, {
        evt:{
            name: "yay",
            path: ['lol']
        }
    });
});
emit({
    name: 'yay1'
});