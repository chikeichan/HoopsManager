Trio.Module.import({
    'headerStyle'       : './src/modules/layout/view/style/headerStyle.js',
})

.and.export('headerView', function(ret) {

    var HeaderView = Trio.View.extend({

        tagName: 'hoop-header',

        isWebComponent: true,

        style: ret.headerStyle,

        template: {
            'div.header': {
                ref: 'header',
                'div.row-resizable': {
                    'mousedown': 'resizeY'
                }
            }
        }
    })

    return HeaderView;
});

