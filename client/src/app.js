Trio.Module.import({
    'resources': './src/resources/index.js',
    'variables': './src/style/variables.js'
})

.and.import({
    'layoutModule': './src/modules/layout/layout.js',
    'playerModule': './src/modules/player/player.js'
})

.then(function(ret) {
    var layout = ret.layoutModule;
    var playerModule = ret.playerModule;

    var canvasEl;
    
    layout.create();
    canvasEl = layout.view.refIndex['canvas'];
    canvasEl.appendChild(playerModule.view.el)
    playerModule.updateInfo();

});
