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
                    this.set(rsp[0])
                }.bind(this));
        }
    });

    return PlayerFactory;
});