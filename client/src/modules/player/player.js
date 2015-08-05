Trio.Module.import({
    'baseModule'       : './src/modules/base/baseModule/base.js',
    'playerFactory'      : './src/modules/player/factory/playerFactory.js',
    'playerView'       : './src/modules/player/view/playerView.js',
    'playerService' : './src/modules/player/service/playerService.js'
})

.and.export('playerModule', function(ret) {
    var factory = new ret.playerFactory({});

    var view = ret.baseModule;
    var playerView = new ret.playerView({});

    view.refIndex['title'].appendChild(playerView.refIndex['name'])
    view.refIndex['secondaryTitle'].appendChild(playerView.refIndex['info'])
    view.refIndex['content'].appendChild(playerView.refIndex['playerInfo'])

    var service = new ret.playerService({
        model: factory,
        view: view
    });

    return service;
});
