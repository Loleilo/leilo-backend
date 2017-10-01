on({
    name: 'init_run',
    src: '*'
}, () => {
    once({
        name: 'request_response',
        path: 'req1',
        dst: 'leilo',
    }, () => {
        emit({
            name: 'gut content'
        });
        emit({
            name: 'init_done'
        });
    });
    emit({
        name: 'request_elevated',
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