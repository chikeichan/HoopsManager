Trio.Module.import({
    'layoutFactory'          : './src/modules/layout/factory/layoutFactory.js',
    'layoutComponent'        : './src/modules/layout/component/layoutComponent.js',
    'layoutService'          : './src/modules/layout/service/layoutService.js',
})

.and.export('layoutModule', function(ret) {
    return {
        create: function() {
            var factory = new ret.layoutFactory({});
            var component = document.createElement('hoop-layout');
            var service = new ret.layoutService({
                factory: factory,
                component: component
            });
            return service;
        }
    };
});
