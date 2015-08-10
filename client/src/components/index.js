Trio.Module.import({
    'baseModule': './src/components/baseModule/baseModule.js',
    'miniInfoBox': './src/components/miniInfoBox/miniInfoBox.js'
})

.and.export('components', function(ret) {
    return ret;
});