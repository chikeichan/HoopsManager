Trio.Module.export('headerStyle', function() {

    var style = {
        ':host': {
            'display': 'flex',
        },
        'div.header': {
            'display': 'flex',
            'background-color': Trio.Stylizer.getVariable('header-color'),
            'width': '100%',
            'height': '100%',
            'flex-shrink': '0'
        },
        'div.row-resizable': Trio.Stylizer.getVariable('row-resizable')
    };

    return style;

});