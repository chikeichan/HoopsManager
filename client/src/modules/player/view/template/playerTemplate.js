Trio.Module.export('playerTemplate', function() {
    var template = {
        'div.player-header': {
            'div.main': {
                'div.name': {
                    ref: 'name'
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
            },
            'div.player-info': {
                'div.avatar': {
                    ref: 'avatar'
                },
                'div.attributes': {
                    'div.position': {
                        'p.tag': {
                            'textContent': 'POSITION'
                        },
                        'p.position': {
                            ref: 'position'
                        }
                    },
                    'div.team': {
                        'p.tag': {
                            'textContent': 'TEAM'
                        },
                        'p.team': {
                            ref: 'team'
                        }
                    },
                    'div.morale': {
                        'p.tag': {
                            'textContent': 'MORALE'
                        },
                        'p.morale': {
                            ref: 'morale'
                        }
                    },
                    'div.fatigue': {
                        'p.tag': {
                            'textContent': 'FATIGUE'
                        },
                        'p.fatigue': {
                            ref: 'fatigue'
                        }
                    },
                    'div.salary': {
                        'p.tag': {
                            'textContent': 'SALARY'
                        },
                        'p.salary': {
                            ref: 'salary'
                        }
                    },
                    'div.contract': {
                        'p.tag': {
                            'textContent': 'CONTRACT'
                        },
                        'p.contract': {
                            ref: 'contract'
                        }
                    },
                }
            }
        }
    }

    return template;
});