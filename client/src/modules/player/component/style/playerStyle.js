Trio.Module.export('playerStyle', function() {
    var style = {
        'div.avatar': {
            'width': '240px',
            'height': '240px',
            'background-repeat': 'no-repeat',
            'background-position': '40% 50%'
        },
        'div.attributes': {
            'display': 'flex',
            'flex-flow': 'column wrap',
            'margin': '12px',
            'height': '216px',
            'align-items': 'flex-start'
        },
        'div.value': {
            'display': 'flex',
            'height': '12px',
            'line-height': '12px',
            'color': 'white',
            'margin': '6px'
        },
        'div.tag': {
            'display': 'flex',
            'color': 'white',
            'font-size': '12px',
            'background-color': 'rgba(0, 0, 0, 0.75)',
            'padding': '2px 4px',
            'margin': '4px'
        },
        'div.attribute': {
            'display': 'flex',
            'margin': '8px 16px',
            'flex-flow': 'column nowrap',
            'align-items': 'flex-start'
        }
    };
    return style;
});