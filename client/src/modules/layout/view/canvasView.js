Trio.Module.import({
    'canvasStyle'       : './src/modules/layout/view/style/canvasStyle.js'
})

.and.export('canvasView', function(ret) {

    var LayoutView = Trio.View.extend({

        tagName: 'hoop-canvas',

        isWebComponent: true,

        style: ret.canvasStyle,

        template: {
            'div.canvas': {
                ref: 'canvas'
            }
        }
    })

    return LayoutView;
});

