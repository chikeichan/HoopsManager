Trio.Module.import({
    'playerStyle'       : './src/modules/player/component/style/playerStyle.js',
    'playerInfoTemplate'       : './src/modules/player/component/template/playerInfoTemplate.js'
})
.and.export('playerComponent', function(ret) {
    var style = Trio.Stylizer.createStyleTag(ret.playerStyle);
    Trio.Component.extend('hoop-module', {
        tagName: 'hoop-player-module',
        onCreate: function() {
            this.shadowRoot.appendChild(style);
        },
        changeTitle: function(html) {
            this.header.innerHTML = html;
        },
        renderMiniInfo: function(boxes) {
            var frag = document.createDocumentFragment();

            for (var i = 0; i < boxes.length; i++) {
                var box = boxes[i];
                var mini = document.createElement('hoop-mini-info-box');
                mini.setTitle(box.title);
                mini.setValue(box.value);
                frag.appendChild(mini);
            }

            this.subheader.innerHTML = '';
            this.subheader.appendChild(frag);
        },
        renderPlayerInfo: function(data) {
            this.content.innerHTML = '';
            this.content.appendChild(ret.playerInfoTemplate.render(data));
        }
    });
});