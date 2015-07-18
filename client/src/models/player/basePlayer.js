var Player = Yaf.Model.extend({
    initialize: function() {
        this.eventBus.subscribe('changed:height', function(a) {
            console.log(this, a);
        });

        this.eventBus.subscribe('running', function(a) {
            console.log('model', a);
        })
    }
});

var testModel = new Player({
    height: 62,
    weight: 178,
    speed: 8
});

var PlayerCtrl = Yaf.Controller.extend({
    run: function(num) {
        this.eventBus.publish('running', this, num);
    }
});

var PlayerView = Yaf.View.extend({
    initialize: function() {
        var player = document.createElement('div');
        player.className = 'player';
        player.style.width = '50px';
        player.style.height = '50px';
        player.style.backgroundColor = 'blue';
        player.style.borderRadius = '50%';
        document.body.appendChild(player);

        this.eventBus.subscribe('running', function(a) {
            player.style.marginLeft = a +'px';
        });
    }
})

var testView = new PlayerView({
    eventBus: testModel.eventBus
});

var testController = new PlayerCtrl({
    model: testModel,
    view: testView,
    eventBus: testModel.eventBus
});

testController.run(100);

module.exports = Player;