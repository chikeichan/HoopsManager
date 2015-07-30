var vinfo = {
    'display': 'flex'
}
Trio.Module.export('playerView', function() {
    var PlayerView = Trio.View.extend({
        tagName: 'hoop-player',

        isWebComponent: true,

        style: {
            ':host': {
                'margin': '12px',
                'width': '100%',
                'height': '100%'
            },
            'div.player-header': {
                'display': 'flex',
                'padding': '8px',
                'border-bottom': '1px solid rgba(0, 0, 0, 0.2)'
            },
            'img.avatar': {
                'width': '240px',
                'height': '240px'
            },
            'div.player-info': {
                'display': 'flex',
                'width': '100%',
                'flex-flow': 'column nowrap'
            },
            'div.main': {
                'display': 'flex',
                'font-size': '24px',
                'font-family': 'Helvetica',
                'background-color': 'rgba(0, 0, 0, 0.7)',
                'color': 'white',
                'padding': '8px'
            },
            'div.name': {
                'margin-right': '8px',
                'font-weight': 'bold'
            },
            'div.age': vinfo,
            'div.height': vinfo,
            'div.weight': vinfo
        },
        
        template: {
            'div.player-header': {
                'img.avatar': {
                    ref: 'avatar'
                },
                'div.player-info': {
                    'div.main': {
                        'div.name': {
                            ref: 'name'
                        }
                    },
                    'div.secondary': {
                        'div.age': {
                            ref: 'age'
                        },
                        'div.height': {
                            ref: 'height'
                        },
                        'div.weight': {
                            ref: 'weight'
                        },
                        'div.birth-place': {
                            ref: 'birthPlace'
                        }
                    }
                }
            }
        },
        render: function(d) {
            this.refIndex['avatar'].src             = d.avatarUrl;
            this.refIndex['name'].textContent       = d.fullName;
            this.refIndex['age'].textContent        = d.age;
            this.refIndex['height'].textContent     = d.heightFt;
            this.refIndex['weight'].textContent     = d.weightLb;
            this.refIndex['birthPlace'].textContent = d.placeOfBirth;
        }
    });

    return PlayerView;
});