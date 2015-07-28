Trio.Module.export('layoutStyle', function(done) {

    var style = {
        ':host': {
            'display': 'flex',
            'flex': '1 1 auto',
            'width': '100%',
            'height': '100%',
            'flex-flow': 'column nowrap',
        },
        'div.header': {
            'display': 'flex',
            'background-color': '#3E3E3E',
            'width': '100%',
            'height': '100%',
            'flex-shrink': '0'
        },
        'div.nav': {
            'display': 'flex',
            'background-color': '#5F5F5F',
            'width': '100%',
            'flex-shrink': '0'
        },
        'div.canvas': {
            'display': 'flex',
            'background-color': '#999999',
            'width': '100%',
        },
        'div.main': {
            'display': 'flex',
            'flex': '1 1 auto',
            'flex-flow': 'row nowrap',
            'height': '100%'
        },
        'div.row-resizable': {
            'cursor': 'row-resize',
            'width': '100%',
            'height': '4px',
            'position': 'relative',
            'top': '100%'
        },
        'div.col-resizable': {
            'cursor': 'col-resize',
            'width': '4px',
            'position': 'relative',
            'left': '100%'
        }
    };

    done(style);

});