Trio.Module.import({
    'layoutStyle'       : './src/modules/layout/view/style/layoutStyle.js'
})

.and.export('layoutView', function(ret) {

    var LayoutView = Trio.View.extend({

        tagName: 'hoop-layout',

        isWebComponent: true,

        style: ret.layoutStyle
    });

    return LayoutView;
});

