Trio.Module.import({
    'navStyle'       : './src/modules/layout/view/style/navStyle.js'
})

.and.export('navView', function(ret) {

    var LayoutView = Trio.View.extend({

        tagName: 'hoop-nav',

        isWebComponent: true,

        style: ret.navStyle,

        template: {
            'div.nav': {
                ref: 'nav',
                'div.col-resizable': {
                    'mousedown': 'resizeX'
                }
            }
        }
    })

    return LayoutView;
});

