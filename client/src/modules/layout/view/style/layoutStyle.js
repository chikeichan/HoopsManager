Trio.Module.export('layoutStyle', function() {

    var style = {
        ':host': {
            'display': 'flex',
            'flex': '1 1 auto',
            'width': '100%',
            'height': '100%',
            'flex-flow': 'column nowrap',
        },

        'div.main': {
            'display': 'flex',
            'flex': '1 1 auto',
            'flex-flow': 'row nowrap',
            'height': '100%'
        },
    };

    return style;

});