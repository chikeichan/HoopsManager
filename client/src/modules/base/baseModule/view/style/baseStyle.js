Trio.Module.export('baseStyle', function() {
    var style = {
        ':host': {
            'margin': '12px',
            'width': '100%',
            'font-family': 'Helvetica',
            'font-size': '18px',
            'height': '100%',
            'background-color': 'rgba(255, 255, 255, 0.25)'
        },

        'div.base-header': {
            'display': 'flex',
            'padding': '8px',
            'border-bottom': '1px solid rgba(0, 0, 0, 0.2)',
            'flex-flow': 'column nowrap'
        },

        'div.secondary-title': {
            'display': 'flex',
            'margin-left': '8px'
        },

        'div.main': {
            'display': 'flex',
            'background-color': 'rgba(0, 0, 0, 0.5)',
            'margin': '0px -8px',
            'align-items': 'center',
            'flex-flow': 'row nowrap',
            'height': '58px'
        },

        'div.title': {
            'color': 'white',
            'padding': '12px 24px',
            'text-transform': 'uppercase',
            'display': 'flex',
            'flex': '1 1 auto',
            'font-size': '30px',
            'align-items': 'center'
        },

        'div.base-content': {
            'display': 'flex',
            'width': '100%',
            'flex-flow': 'row nowrap'
        },
    }

    return style;
});