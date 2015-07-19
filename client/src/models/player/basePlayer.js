var Player = Yaf.Model.extend({});

var testModel = new Player({
    height: 62,
    weight: 178,
    name: 'Jacky Chan'
});

var PlayerCtrl = Yaf.Controller.extend({
    events: {
        'click height': 'addHeight',
        'click weight': 'subtractWeight'
    },

    initialize: function() {
        this.eventBus.subscribe('changed', function(a) {
            this.view.postRender(this.model.attributes);
        }.bind(this));
    },

    addHeight: function() {
        var height = this.model.get('height');
        this.model.set('height', height + 1);
    },

    subtractWeight: function() {
        var weight = this.model.get('weight');
        this.model.set('weight', weight - 1);
    }
});

var textStyle = {
    'font-family': 'arial',
    margin: '4px 12px',
    'font-size': '12px'
}

var PlayerView = Yaf.View.extend({
    tagName: 'div',
    className: 'player',
    template: {
        'div.avatar': {
            style: {
                width: '50px',
                height: '50px',
                backgroundColor: 'blue',
                borderRadius: '50%'
            }
        },

        'div.info' : {
            'p#name': {
                ref: 'name',
                style: textStyle
            },
            'p#height': {
                ref: 'height',
                style: textStyle
            },
            'p#weight': {
                ref: 'weight',
                style: textStyle
            }
        },

        style: {
            width: '200px',
            height: '100px',
            backgroundColor: 'white',
            border: '1px solid black',
            display: 'flex',
            'flex-flow': 'row nowrap',
            padding: '8px'
        }
    },

    postRender: function(opts) {
        this.index['name'].textContent = opts.name;
        this.index['height'].textContent = opts.height;
        this.index['weight'].textContent = opts.weight;
    }
})

var testView = new PlayerView({
    eventBus: testModel.eventBus
});

testView.render().postRender(testModel.attributes);
document.body.appendChild(testView.el)

var testController = new PlayerCtrl({
    model: testModel,
    view: testView,
    eventBus: testModel.eventBus
});

module.exports = Player;
