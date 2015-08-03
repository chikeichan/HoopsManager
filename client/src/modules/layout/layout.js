Trio.Module.import({
    'layoutFactory'      : './src/modules/layout/factory/layoutFactory.js',
    'layoutView'       : './src/modules/layout/view/layoutView.js',
    'layoutController' : './src/modules/layout/controller/layoutController.js'
})

.and.export('layoutModule', function(ret) {
    var factory = new ret.layoutFactory({});

    var view = new ret.layoutView({});

    var controller = new ret.layoutController({
        model: factory,
        view: view
    });

    return controller;
});
