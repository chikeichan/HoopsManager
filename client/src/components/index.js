Trio.Module.import({
    'baseModule': './src/components/baseModule/baseModule.js',
    'miniInfoBox': './src/components/miniInfoBox/miniInfoBox.js',
    'pieContainer': './src/components/pieContainer/pieContainer.js'
})

.and.export('components', function(ret) {
    return ret;
});