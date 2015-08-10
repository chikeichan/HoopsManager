Trio.Module.import({
    'playerFactory'      : './src/modules/player/factory/playerFactory.js',
    'playerComponent'       : './src/modules/player/component/playerComponent.js',
    'playerService' : './src/modules/player/service/playerService.js'
})

.and.export('playerModule', function(ret) {
    return {
        create: function() {
            var factory = new ret.playerFactory({});
            var component = document.createElement('hoop-player-module');
            var service = new ret.playerService({
                factory: factory,
                component: component
            });
            return service;
        }
    }
});
