Trio.Module.import({
    'playerModel'      : './src/modules/player/model/playerModel.js',
    'playerView'       : './src/modules/player/view/playerView.js',
    'playerController' : './src/modules/player/controller/playerController.js'
})

.and.export('playerModule', function(ret, done) {
    var model = new ret.playerModel({});

    var view = new ret.playerView({});

    var controller = new ret.playerController({
        model: model,
        view: view
    });

    done(controller);
});