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

    Trio.Stylizer.registerVariables('header-color', 'rgba(0, 0, 0, 0.7)');
    Trio.Stylizer.registerVariables('theme-color', '#00B8FF');
    // Trio.Stylizer.registerVariables('theme-color', '#C973C2');
});