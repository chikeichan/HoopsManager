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
                'display': 'flex'
            },
            'img.avatar': {
                'width': '240px',
                'height': '240px'
            },
            'div.player-info': {
                'display': 'flex',
                'margin' : '12px',
                'flex-flow': 'column nowrap'
            },
            'div.main': {
                'display': 'flex',
                'font-size': '24px',
                'font-family': 'Arial'
            },
            'div.name': {
                'margin-right': '8px'
            }
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
                        },
                        'div.age': {
                            ref: 'age'
                        }
                    },
                    'div.secondary': {
                        'div.height': {
                            ref: 'height'
                        },
                        'div.weight': {
                            ref: 'weight'
                        },
                        'div.birth-lace': {
                            ref: 'birthPlace'
                        },
                        'div.university': {
                            ref: 'university'
                        }
                    }
                }
            }
        },
        render: function(d) {
            this.refIndex['avatar'].src = d.avatarUrl;
            this.refIndex['name'].textContent = d.firstName + ' ' + d.lastName;
            this.refIndex['age'].textContent = '' + Math.floor((new Date().getTime() - d.dateOfBirth)/31536000000);
            this.refIndex['height'].textContent = '' + Math.floor(d.height/12) + 'ft' + d.height % 12;
            this.refIndex['weight'].textContent = d.weight + 'lb';
            this.refIndex['birthPlace'].textContent = d.placeOfBirth;
            this.refIndex['university'].textContent = d.university;
        }
    });

    return PlayerView;
});