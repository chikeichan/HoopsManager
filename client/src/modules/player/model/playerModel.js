Trio.Module.export('playerModel', function() {
    var PlayerModel = Trio.Model.extend({
        defaults: {
            lastName: 'James',
            firstName: 'LeBron',
            dateOfBirth: 473241600000,
            avatarUrl: 'http://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254',
            height: 80,
            weight: 250,
            placeOfBirth: 'Akron, OH',
            university: 'St-Vincent St-Mary'
        }
    });

    return PlayerModel;
});