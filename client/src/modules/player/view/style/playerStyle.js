Trio.Module.export('playerStyle', function() {
    var vinfo = {
        'display': 'flex',
        'padding': '8px 30px',
        'height': '18px',
        'line-height': '18px',
        'color': 'white',
        'margin': '0'
    }

    var container = {
        'display': 'flex',
        'margin': '0 4px',
        'background-color': 'rgba(0, 184, 255, 1)',
        'flex-flow': 'column nowrap',
        'align-items': 'center',
        'height': '68px',
        'border-radius': '2px'
    }

    var attrContainer = {
        'display': 'flex',
        'margin': '8px 16px',
        'flex-flow': 'column nowrap',
        'align-items': 'flex-start'
    }

    var attrInfo = {
        'display': 'flex',
        'height': '12px',
        'line-height': '12px',
        'color': 'white',
        'margin': '6px'
    }

    var style = {
        ':host': {
            'margin': '12px',
            'width': '100%',
            'font-family': 'Helvetica',
            'font-size': '18px',
            'height': '100%',
            'background-color': 'rgba(255, 255, 255, 0.25)'
        },

        'div.main': {
            'display': 'flex',
            'background-color': 'rgba(0, 0, 0, 0.5)',
            'margin': '0px -8px',
            'align-items': 'center',
            'flex-flow': 'row nowrap',
            'height': '58px'
        },

        'div.player-header': {
            'display': 'flex',
            'padding': '8px',
            'border-bottom': '1px solid rgba(0, 0, 0, 0.2)',
            'flex-flow': 'column nowrap'
        },
        'div.avatar': {
            'width': '240px',
            'height': '240px'
        },
        'div.player-info': {
            'display': 'flex',
            'width': '100%',
            'flex-flow': 'row nowrap'
        },
        'div.info': {
            'display': 'flex',
            'margin-left': '8px'
        },
        'div.name': {
            'color': 'white',
            'padding': '12px 24px',
            'margin': '0 -8px 8px -8px',
            'text-transform': 'uppercase',
            'display': 'flex',
            'flex': '1 1 auto',
            'font-size': '30px',
            'align-items': 'center'
        },
        'p.age': vinfo,
        'p.height': vinfo,
        'p.weight': vinfo,
        'p.birth-place': vinfo,

        'div.title': {
            'display': 'flex',
            'height': '18px',
            'line-height': '18px',
            'color': 'white',
            'background-color': 'rgba(0, 0, 0, 0.7)',
            'width': '100%',
            'flex-direction': 'column',
            'align-items': 'center',
            'padding': '8px 0',
            'border-top-right-radius': '2px',
            'border-top-left-radius': '2px'
        },
        'div.age': container,
        'div.height': container,
        'div.weight': container,
        'div.birth-place': container,

        'span.jersey-number': {
            'color': 'rgba(0, 184, 255, 1)',
            'font-size': '40px',
            'margin': '0px 8px',
            'font-weight': 'bold'
        },
        'div.attributes': {
            'display': 'flex',
            'flex-flow': 'column wrap',
            'margin': '12px',
            'height': '216px',
            'align-items': 'flex-start'
        },
        'p.tag': {
            'display': 'flex',
            'color': 'white',
            'font-size': '12px',
            'background-color': 'rgba(0, 0, 0, 0.75)',
            'padding': '2px 4px',
            'margin': '4px'
        },

        'p.position': attrInfo,
        'p.team': attrInfo,
        'p.morale': attrInfo,
        'p.fatigue': attrInfo,
        'p.salary': attrInfo,
        'p.contract': attrInfo,

        'div.position': attrContainer,
        'div.team': attrContainer,
        'div.morale': attrContainer,
        'div.fatigue': attrContainer,
        'div.salary': attrContainer,
        'div.contract': attrContainer,
    }

    return style;
});