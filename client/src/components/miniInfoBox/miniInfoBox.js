Trio.Module.import({
    'miniInfoBoxTemplate': './src/components/miniInfoBox/template/miniInfoBoxTemplate.js',
    'miniInfoBoxStyle'   : './src/components/miniInfoBox/style/miniInfoBoxStyle.js'
})
.and.export('miniInfoBox', function(ret) {
    var frag = ret.miniInfoBoxTemplate.render();
    var style = Trio.Stylizer.createStyleTag(ret.miniInfoBoxStyle);

    return Trio.Component.register({
        tagName: 'hoop-mini-info-box',
        fragment: frag,
        style: style,
        onCreate: function() {
            this.boxTitle = this.shadowRoot.querySelector('.title');
            this.boxValue = this.shadowRoot.querySelector('.value');
        },
        setTitle: function(title) {
            this.boxTitle.textContent = title;
        },
        setValue: function(value) {
            this.boxValue.textContent = value;
        },
    });
});