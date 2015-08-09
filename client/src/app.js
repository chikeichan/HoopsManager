Trio.Module.import({
    'resources': './src/resources/index.js',
    'variables': './src/style/variables.js'
})

.and.import({
    'layoutModule': './src/modules/layout/layout.js',
    // 'playerModule': './src/modules/player/player.js'
})

.then(function(ret) {
    var el = document.createElement('hoop-layout');
    document.body.appendChild(el);
});
