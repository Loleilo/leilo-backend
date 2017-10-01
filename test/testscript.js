on({
    name: 'init_run',
    src: '*'
}, () => {
    once({
        name: 'request_response',
        path: 'req1'
    }, () => {
        console.log('gud content 1');
        emit({
            name: 'init_done'
        });
    });
    emit({
        name: 'request_elevated',
        path: 'req1'
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