Trio.Module.import({
    'layoutFactory'          : './src/modules/layout/factory/layoutFactory.js',
    'layoutComponent'        : './src/modules/layout/component/layoutComponent.js',
    'layoutService'          : './src/modules/layout/service/layoutService.js',
})

.and.export('layoutModule', function(ret) {
    // var factory = new ret.layoutFactory({});

    // var nav = new ret.navComponent({});
    // var header = new ret.headerComponent({});
    // var canvas = new ret.canvasComponent({});
    // var component = new ret.layoutComponent({});
    // var main = document.createElement('div');
    // var service = new ret.layoutService({
    //     factory: factory,
    //     component: component,
    //     nav: nav,
    //     header: header,
    //     canvas: canvas
    // });
    
    // main.className = 'main';
    // main.appendChild(nav.el);
    // main.appendChild(canvas.el);
    
    // component.host.appendChild(header.el);
    // component.host.appendChild(main);

    // return service;
});
