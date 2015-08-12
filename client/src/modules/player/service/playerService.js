Trio.Module.export('playerService', function() {
    var PlayerService = Trio.Service.extend({
        initialize: function(opt) {
            this.factory = opt.factory;
            this.component = opt.component;
            this.factory.eventBus.subscribe('update:player', this.updateInfo.bind(this));

        },
        updateInfo: function() {
            this.component.updateTitle(this.factory.fullTitle);
            this.component.updateMiniInfo(this.factory.vital);
            this.component.updatePlayerInfo(this.factory.playerInfo);
            this.component.updateOverallAttributes(this.factory.playerAttributes.overall);
        }
    });

    return PlayerService;
});