Trio.Module.export('playerService', function() {
    var PlayerService = Trio.Service.extend({
        initialize: function(opt) {
            this.factory = opt.factory;
            this.component = opt.component;
            this.factory.eventBus.subscribe('change', this.updateInfo.bind(this));
            this.updateInfo();
        },
        updateInfo: function() {
            var d = this.factory.clone();
            this.component.changeTitle(d.firstName + ' <span class="jersey-number">' + d.jerseyNumber + '</span> ' + d.lastName);
            this.component.renderMiniInfo([
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
            }]);

            this.component.renderPlayerInfo({
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
            });
        }
    });

    return PlayerService;

    function convertMillions(num) {
        return '$' + Math.floor(num/1000000) + '.' + Math.floor(num%1000000/10000) + 'M'
    }
});