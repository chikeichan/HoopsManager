Trio.Module.import({
    'layoutModel'      : './src/modules/layout/model/layoutModel.js',
    'layoutView'       : './src/modules/layout/view/layoutView.js',
    'layoutController' : './src/modules/layout/controller/layoutController.js'
})

.and.export('layoutModule', function(ret) {
    var model = new ret.layoutModel({});

    var view = new ret.layoutView({});

    var controller = new ret.layoutController({
        model: model,
        view: view
    });

    return controller;
});
