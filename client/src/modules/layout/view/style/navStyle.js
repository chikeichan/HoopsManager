Trio.Module.export('navStyle', function() {

    var style = {
        ':host': {
            'display': 'flex',
        },
        'div.nav': {
            'display': 'flex',
            'background-color': Trio.Stylizer.getVariable('base-color'),
            'width': '100%',
            'flex-shrink': '0'
        },
        'div.col-resizable': Trio.Stylizer.getVariable('col-resizable')
    };

    return style;

});