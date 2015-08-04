Trio.Module.import({
    'playerResource': './src/resources/playerResource.js'
})

.and.export('resources', function(ret) {
    return ret;
});