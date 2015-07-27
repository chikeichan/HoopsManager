Trio.export('layoutModule', function(done) {
    Trio.import({
        'layoutModel'      : './src/modules/layout/model/layoutModel.js',
        'layoutView'       : './src/modules/layout/view/layoutView.js',
        'layoutController' : './src/modules/layout/controller/layoutController.js'
    })
    
    .then(function(ret) {
        var model = new ret.layoutModel({
            x: 200,
            y: 50
        });

        var view = new ret.layoutView({});

        var controller = new ret.layoutController({
            model: model,
            view: view
        });

        return controller;
    })

    .done(done)
});