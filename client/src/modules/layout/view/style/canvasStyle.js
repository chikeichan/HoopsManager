Trio.Module.export('canvasStyle', function() {

    var style = {
        ':host': {
            'display': 'flex',
            'flex': '1 1 auto'
        },
        'div.canvas': {
            'display': 'flex',
            'background-color': Trio.Stylizer.getVariable('canvas-color'),
            'width': '100%',
            'overflow': 'auto'
        },
    };

    return style;

});