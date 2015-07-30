Trio.Module.export('playerModel', function() {
    var PlayerModel = Trio.Model.extend({
        defaults: {
            lastName: 'Chan',
            firstName: 'Jacky',
            dateOfBirth: 509702400000,
            avatarUrl: 'https://avatars3.githubusercontent.com/u/8507735?v=3&s=460',
            height: 63,
            weight: 178,
            placeOfBirth: 'Hong Kong',
            university: 'UC San Diego'
        }
    });

    return PlayerModel;
});