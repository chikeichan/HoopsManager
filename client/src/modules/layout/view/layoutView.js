Trio.Module.import({
    'layoutStyle'       : './src/modules/layout/view/style/layoutStyle.js',
    'layoutTemplate'       : './src/modules/layout/view/template/layoutTemplate.js'
})

.and.export('layoutView', function(ret) {

    var LayoutView = Trio.View.extend({

        tagName: 'hoop-layout',

        isWebComponent: true,

        style: ret.layoutStyle,

        template: ret.layoutTemplate,

        render: function(d) {
            this.refIndex.header.style.height = '' + d.y + 'px';
            this.refIndex.nav.style.width     = '' + d.x + 'px';
        }
    })

    return LayoutView;
});
