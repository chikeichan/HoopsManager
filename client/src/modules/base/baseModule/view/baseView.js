Trio.Module.import({
    'baseStyle'       : './src/modules/base/baseModule/view/style/baseStyle.js',
    'baseTemplate'       : './src/modules/base/baseModule/view/template/baseTemplate.js'
})
.and.export('baseView', function(ret) {
    var BaseView = Trio.View.extend({
        tagName: 'hoop-base-module',

        isWebComponent: true,

        style: ret.baseStyle,
        
        template: ret.baseTemplate
    });

    return BaseView;
});