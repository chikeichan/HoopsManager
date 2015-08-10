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
            this.statMeter = this.shadowRoot.querySelector('.stat-meter');
        },
        renderOverallAttributes: function(percent) {
            var i = 0;
            var j = 0;
            var tick = setInterval(function() {
                i = i + Math.sin(j);
                j = j + (0.02 / (percent/100));
                if (i >= percent - 0.1) {
                    this.statMeter.setPercentage(percent);
                    this.statMeter.content.textContent = percent;
                    clearInterval(tick)
                    return;
                }
                this.statMeter.content.textContent = Math.floor(i);
                this.statMeter.setPercentage(i);
            }.bind(this), 16)
        }
    });
});