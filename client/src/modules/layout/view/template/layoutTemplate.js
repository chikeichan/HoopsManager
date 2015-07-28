Trio.Module.export('layoutTemplate', function(done) {
    var template = {

        'div.header': {
            ref: 'header',
            'div.row-resizable': {
                'mousedown': 'resizeY'
            }
        },

        'div.main': {
            'div.nav': {
                ref: 'nav',
                'div.col-resizable': {
                    'mousedown': 'resizeX'
                }
            },
            'div.canvas': {}
        }
    };

    done(template);
});