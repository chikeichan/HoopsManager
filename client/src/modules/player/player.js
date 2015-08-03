Trio.Module.import({
    'playerFactory'      : './src/modules/player/factory/playerFactory.js',
    'playerView'       : './src/modules/player/view/playerView.js',
    'playerController' : './src/modules/player/controller/playerController.js'
})

.and.export('playerModule', function(ret) {
    var factory = new ret.playerFactory({});

    var view = new ret.playerView({});

    var controller = new ret.playerController({
        model: factory,
        view: view
    });

    return controller;
});
