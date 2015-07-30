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
    'background-color': 'rgba(0, 255, 250, 0.45)',
    'flex-flow': 'column nowrap',
    'align-items': 'center',
    'height': '68px',
}
Trio.Module.export('playerView', function() {
    var PlayerView = Trio.View.extend({
        tagName: 'hoop-player',

        isWebComponent: true,

        style: {
            ':host': {
                'margin': '12px',
                'width': '100%',
                'font-family': 'Helvetica',
                'font-size': '18px',
                'height': '100%',
                'background-color': Trio.Stylizer.getVariable('base-color')
            },
            'div.player-header': {
                'display': 'flex',
                'padding': '8px',
                'border-bottom': '1px solid rgba(0, 0, 0, 0.2)',
                'flex-flow': 'column nowrap',
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
                'background-color': 'rgba(0, 0, 0, 0.5)',
                'color': 'white',
                'padding': '12px 24px',
                'margin': '0 -8px 8px -8px',
                'text-transform': 'uppercase'
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
                'padding': '8px 0'
            },
            'div.age': container,
            'div.height': container,
            'div.weight': container,
            'div.birth-place': container
        },
        
        template: {
            'div.player-header': {
                'div.name': {
                    ref: 'name'
                },
                'div.player-info': {
                    'div.avatar': {
                        ref: 'avatar'
                    },
                    'div.info': {
                        'div.age': {
                            'div.title': {
                                'textContent': 'Age'
                            },
                            'p.age': {
                                ref: 'age'
                            }
                        },
                        'div.height': {
                            'div.title': {
                                'textContent': 'Height'
                            },
                            'p.height': {
                                ref: 'height'
                            }
                        },
                        'div.weight': {
                            'div.title': {
                                'textContent': 'Weight'
                            },
                            'p.weight': {
                                ref: 'weight'
                            }
                        },
                        'div.birth-place': {
                            'div.title': {
                                'textContent': 'From'
                            },
                            'p.birth-place': {
                                ref: 'birthPlace'
                            }
                        }
                    }
                }
            }
        },
        render: function(d) {
            this.refIndex['avatar'].style.background = 'url(' + d.avatarUrl + ') 40% 50% no-repeat';
            this.refIndex['name'].textContent        = d.fullName;
            this.refIndex['age'].textContent         = d.age;
            this.refIndex['height'].textContent      = d.heightFt;
            this.refIndex['weight'].textContent      = d.weightLb;
            this.refIndex['birthPlace'].textContent  = d.placeOfBirth;
        }
    });

    return PlayerView;
});