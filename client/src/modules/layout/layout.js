Trio.Module.import({
    'layoutFactory'      : './src/modules/layout/factory/layoutFactory.js',
    'layoutView'       : './src/modules/layout/view/layoutView.js',
    'layoutController' : './src/modules/layout/controller/layoutController.js',
    'headerView'        : './src/modules/layout/view/headerView.js',
    'canvasView'        : './src/modules/layout/view/canvasView.js',
    'navView'           : './src/modules/layout/view/navView.js',
})

.and.export('layoutModule', function(ret) {
    var factory = new ret.layoutFactory({});

    var nav = new ret.navView({});
    var header = new ret.headerView({});
    var canvas = new ret.canvasView({});

    var view = new ret.layoutView({});
    var main = document.createElement('div');
    main.className = 'main';
    main.appendChild(nav.el);
    main.appendChild(canvas.el);
    
    view.host.appendChild(header.el);
    view.host.appendChild(main);

    var controller = new ret.layoutController({
        model: factory,
        view: view,
        nav: nav,
        header: header,
        canvas: canvas
    });


    return controller;
});
