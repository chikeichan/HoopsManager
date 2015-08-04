Trio.Module.export('variables', function() {

    Trio.Stylizer.registerVariables('row-resizable', {
        'cursor': 'row-resize',
        'width': '100%',
        'height': '4px',
        'position': 'relative',
        'top': '100%'
    });

    Trio.Stylizer.registerVariables('col-resizable', {
        'cursor': 'col-resize',
        'width': '4px',
        'position': 'relative',
        'left': '100%'
    });

    Trio.Stylizer.registerVariables('header-color', 'black');
    Trio.Stylizer.registerVariables('canvas-color', 'rgba(255, 255, 255, 0.1)');
    Trio.Stylizer.registerVariables('base-color', 'rgba(0, 184, 255, 0.5)');

});