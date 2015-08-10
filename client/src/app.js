Trio.Module.import({
    'resources': './src/resources/index.js',
    'variables': './src/style/variables.js',
    'components': './src/components/index.js'
})

.and.import({
    'layoutModule': './src/modules/layout/layout.js',
    'playerModule': './src/modules/player/player.js'
})

.then(function(ret) {
    var layout = ret.layoutModule.create();
    var playerModule = ret.playerModule.create();
    layout.appendToCanvas(playerModule.component)
});
