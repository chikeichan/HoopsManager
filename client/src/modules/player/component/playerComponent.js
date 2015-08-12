Trio.Module.import({
    'playerStyle'       : './src/modules/player/component/style/playerStyle.js',
    'playerInfoTemplate'       : './src/modules/player/component/template/playerInfoTemplate.js',
    'playerMiniBoxTemplate'       : './src/modules/player/component/template/playerMiniBoxTemplate.js'
})
.and.export('playerComponent', function(ret) {
    var style = Trio.Stylizer.createStyleTag(ret.playerStyle);
    Trio.Component.extend('hoop-module', {
        tagName: 'hoop-player-module',
        onCreate: function() {
            this.shadowRoot.appendChild(style);
            this.render();
        },

        render: function() {
            this.subheader.appendChild(ret.playerMiniBoxTemplate.render());
            this.content.appendChild(ret.playerInfoTemplate.render(['POSITION','TEAM','MORALE','FATIGUE','SALARY','CONTRACT']));
            this.statMeter = this.shadowRoot.querySelector('.stat-meter');
            this.avatar = this.shadowRoot.querySelector('.avatar');
            this.playerInfo = this.shadowRoot.querySelector('.player-info')
        },

        updateTitle: function(html) {
            this.header.innerHTML = html;
        },
        updateMiniInfo: function(boxes) {
            var miniBoxes = this.subheader.childNodes;
            for (var i = 0; i < boxes.length; i++) {
                var box = boxes[i];
                var mini = miniBoxes[i];
                mini.setTitle(box.title);
                mini.setValue(box.value);
            }
        },
        updatePlayerInfo: function(data) {
            this.avatar.style['background-image'] = 'url(' + data.avatarUrl + ')';
            for (var i = 0; i < data.playerInfo.length; i++) {
                var val = data.playerInfo[i].val;
                var box = this.playerInfo.childNodes[i];
                box.querySelector('.value').textContent = val;
            }
        },
        updateOverallAttributes: function(percent) {
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