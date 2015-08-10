Trio.Module.export('playerService', function() {
    var PlayerService = Trio.Service.extend({
        initialize: function(opt) {
            this.factory = opt.factory;
            this.component = opt.component;
            this.factory.eventBus.subscribe('update:player', this.updateInfo.bind(this));
        },
        updateInfo: function() {
            this.component.changeTitle(this.factory.fullTitle);
            this.component.renderMiniInfo(this.factory.vital);
            this.component.renderPlayerInfo(this.factory.playerInfo);
        }
    });

    return PlayerService;
});