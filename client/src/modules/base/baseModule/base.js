Trio.Module.import({
    'baseView'       : './src/modules/base/baseModule/view/baseView.js'
    // 'baseController' : './src/modules/base/baseModule/controller/baseController.js',
})

.and.export('baseModule', function(ret) {
    return new ret.baseView({});
});
