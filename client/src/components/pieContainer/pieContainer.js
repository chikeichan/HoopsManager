Trio.Module.import({
    'pieContainerTemplate': './src/components/pieContainer/template/pieContainerTemplate.js',
    'pieContainerStyle'   : './src/components/pieContainer/style/pieContainerStyle.js'
})
.and.export('pieContainer', function(ret) {
    var frag = ret.pieContainerTemplate.render();
    var style = Trio.Stylizer.createStyleTag(ret.pieContainerStyle);

    return Trio.Component.register({
        tagName: 'hoop-pie-container',
        fragment: frag,
        style: style,
        onCreate: function() {
            this.spinner = this.shadowRoot.querySelector('.spinner');
            this.mask = this.shadowRoot.querySelector('.mask');
            this.filler = this.shadowRoot.querySelector('.filler');
            this.content = this.shadowRoot.querySelector('.content');
        },
        setPercentage: function(percent) {
            percent = Math.min(percent, 100);
            percent = Math.max(percent, 0);
            if (percent >= 0 && percent <= 50) {
                this.mask.style.opacity = 1;
                this.filler.style.opacity = 0;
            } else {
                this.mask.style.opacity = 0;
                this.filler.style.opacity = 1;
            }
            this.spinner.style['transform'] = 'rotate(' + (360 * percent/100) + 'deg)';
        }
    });
});