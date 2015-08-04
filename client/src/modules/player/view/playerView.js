Trio.Module.import({
    'playerStyle'       : './src/modules/player/view/style/playerStyle.js',
    'playerTemplate'       : './src/modules/player/view/template/playerTemplate.js'
})
.and.export('playerView', function(ret) {
    var PlayerView = Trio.View.extend({
        tagName: 'hoop-player',

        isWebComponent: true,

        style: ret.playerStyle,
        
        template: ret.playerTemplate,

        render: function(d) {
            this.refIndex['avatar'].style.background = 'url(' + d.avatarUrl + ') 40% 50% no-repeat';
            this.refIndex['name'].innerHTML          = d.fullName;
            this.refIndex['age'].textContent         = d.age;
            this.refIndex['height'].textContent      = d.heightFt;
            this.refIndex['weight'].textContent      = d.weightLb;
            this.refIndex['birthPlace'].textContent  = d.placeOfBirth;
            this.refIndex['position'].textContent    = d.position;
            this.refIndex['team'].textContent        = d.team;
            this.refIndex['morale'].textContent      = d.morale;
            this.refIndex['fatigue'].textContent     = d.fatigue;
            this.refIndex['salary'].textContent      = d.salary;
            this.refIndex['contract'].textContent    = d.contract;
        }
    });

    return PlayerView;
});