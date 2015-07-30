Trio.Module.export('playerController', function() {
    var PlayerController = Trio.Controller.extend({
        modelEvents: {
            'change': 'updateInfo'
        },
        updateInfo: function() {
            var d = this.model.clone();
            this.view.render({
                avatarUrl    : d.avatarUrl,
                fullName     : d.firstName + ' ' + d.lastName,
                age          : '' + Math.floor((new Date().getTime() - d.dateOfBirth)/31536000000),
                heightFt     : '' + Math.floor(d.height/12) + 'ft' + d.height % 12,
                weightLb     : d.weight + 'lb',
                placeOfBirth : d.placeOfBirth,
                university   : d.university
            });
        }
    });

    return PlayerController;
});