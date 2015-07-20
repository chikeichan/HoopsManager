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
        this.view.updateInfo(this.model.attributes);

        this.model.eventBus.subscribe('changed', function(a) {
            this.view.updateInfo(this.model.attributes);
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
    style: {
        'root' : {
            width: '200px',
            height: '100px',
            backgroundColor: 'white',
            border: '1px solid black',
            display: 'flex',
            'flex-flow': 'row nowrap',
            padding: '8px'
        },

        'div.avatar': {
            style: {
                width: '50px',
                height: '50px',
                backgroundColor: 'blue',
                borderRadius: '50%'
            }
        },

        'p#name': textStyle,
        'p#height': textStyle,
        'p#weight': textStyle
    }
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

    initialize: function() {
        this.render();
    },

    render: function() {
        this.el = this.renderTmpl();
    },

    updateInfo: function(opts) {
        this.refIndex['name'].textContent = opts.name;
        this.refIndex['height'].textContent = opts.height;
        this.refIndex['weight'].textContent = opts.weight;
    }
})

var testView = new PlayerView({});

document.body.appendChild(testView.el)

var testController = new PlayerCtrl({
    model: testModel,
    view: testView
});

module.exports = Player;
