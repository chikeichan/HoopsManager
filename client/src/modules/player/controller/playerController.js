Trio.Module.export('playerController', function() {
    var PlayerController = Trio.Controller.extend({
        modelEvents: {
            'change': 'updateInfo'
        },
        updateInfo: function() {
            var d = this.model.clone();
            this.view.render({
                avatarUrl    : d.avatarUrl,
                fullName     : d.firstName + ' <span class="jersey-number">' + d.jerseyNumber + '</span> ' + d.lastName,
                age          : '' + Math.floor((new Date().getTime() - d.dateOfBirth)/31536000000),
                heightFt     : '' + Math.floor(d.height/12) + 'ft' + d.height % 12,
                weightLb     : d.weight + 'lb',
                placeOfBirth : d.placeOfBirth,
                university   : d.university,
                position     : d.position,
                team         : d.team,
                morale       : d.morale,
                fatigue      : d.fatigue,
                salary       : convertMillions(d.salary),
                contract     : d.contractLength + 'YR ' + convertMillions(d.contractAmount)
            });
        }
    });

    return PlayerController;

    function convertMillions(num) {
        return '$' + Math.floor(num/1000000) + '.' + Math.floor(num%1000000/10000) + 'M'
    }
});