Trio.Module.export('baseTemplate', function() {
    var template = {
        'div.base-header': {
            'div.main': {
                'div.title': {
                    ref: 'title'
                },
                'div.secondary-title': {
                    ref: 'secondaryTitle'
                }
            },
        },
        'div.base-content': {
            ref: 'content'
        }
    }

    return template;
});