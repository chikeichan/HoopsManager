Trio.Module.export('playerFactory', function() {
    var PlayerFactory = Trio.Factory.extend({
        defaults: {
            lastName: 'James',
            firstName: 'LeBron',
            jerseyNumber: 23,
            dateOfBirth: 473241600000,
            avatarUrl: 'http://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254',
            height: 80,
            weight: 250,
            placeOfBirth: 'Akron, OH',
            university: 'St-Vincent St-Mary',
            position: 'SF',
            team: 'Cleveland',
            morale: 'Happy',
            fatigue: 'Fresh',
            salary: 22250000,
            contractLength: 2,
            contractAmount: 50000000
        },

        initialize: function() {
            var player = Trio.Resource.get('playerResource');
            this.sync(player, '2aEmDhcqrg');

            player.readOne('2aEmDhcqrg')
                .then(function(rsp) {
                    this.setAll(rsp[0])
                }.bind(this));
        },

        setAll: function(d) {
            this.setTitle(d);
            this.setVital(d);
            this.setPlayerInfo(d);
            this.eventBus.publish('update:player');
        },

        setTitle: function(d) {
            this.fullTitle = d.firstName + ' <span class="jersey-number">' + d.jerseyNumber + '</span> ' + d.lastName;
        },

        setVital: function(d) {
            this.vital = [
                {
                    title: 'Age',
                    value: '' + Math.floor((new Date().getTime() - d.dateOfBirth)/31536000000)
                },
                {
                    title: 'Height',
                    value: '' + Math.floor(d.height/12) + 'ft' + d.height % 12
                },
                {
                    title: 'Weight',
                    value: d.weight + 'lb'
                },
                {
                    title: 'From',
                    value: d.placeOfBirth
                }
            ];
        },

        setPlayerInfo: function(d) {
            this.playerInfo = {
                avatarUrl: d.avatarUrl,
                attributes: [
                    {
                        name: 'POSITION',
                        val: d.position
                    },
                    {
                        name: 'TEAM',
                        val: d.team
                    },
                    {
                        name: 'MORALE',
                        val: d.morale
                    },
                    {
                        name: 'FATIGUE',
                        val: d.fatigue
                    },
                    {
                        name: 'SALARY',
                        val: convertMillions(d.salary)
                    },
                    {
                        name: 'CONTRACT',
                        val: d.contractLength + 'YR ' + convertMillions(d.contractAmount)
                    },
                ]
            }
        }
    });

    return PlayerFactory;

    function convertMillions(num) {
        return '$' + Math.floor(num/1000000) + '.' + Math.floor(num%1000000/10000) + 'M'
    }
});