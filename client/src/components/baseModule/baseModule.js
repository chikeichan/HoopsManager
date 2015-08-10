Trio.Module.import({
    'baseModuleTemplate': './src/components/baseModule/template/baseModuleTemplate.js',
    'baseModuleStyle'   : './src/components/baseModule/style/baseModuleStyle.js',
})
.and.export('baseModule', function(ret) {
    var frag = ret.baseModuleTemplate.render();
    var style = Trio.Stylizer.createStyleTag(ret.baseModuleStyle);

    return Trio.Component.register({
        tagName: 'hoop-module',
        fragment: frag,
        style: style,
        onCreate: function() {
            this.header = this.shadowRoot.querySelector('.title');
            this.subheader = this.shadowRoot.querySelector('.sub-header');
            this.content = this.shadowRoot.querySelector('.content');
        }
    });
});