var Player = Yaf.Model.extend({});

var testModel = new Player({
    height: 62,
    weight: 178,
    name: 'Jacky Chan'
});

var PlayerCtrl = Yaf.Controller.extend({
    viewEvents: {
        'click:p#height': 'addHeight',
        'click:p#weight': 'subtractWeight'
    },

    modelEvents: {
        'changed': 'updateInfo'
    },

    initialize: function() {
        this.updateInfo();
    },

    addHeight: function() {
        var height = this.model.get('height');
        this.model.set('height', height + 1);
    },

    subtractWeight: function() {
        var weight = this.model.get('weight');
        this.model.set('weight', weight - 1);
    },

    updateInfo: function() {
        this.view.renderInfo(this.model.attributes);
    }
});

var textStyle = {
    'font-family': 'arial',
    margin: '4px 12px',
    'font-size': '12px'
};

var cardStyle = {
    width: '200px',
    height: '100px',
    backgroundColor: 'white',
    border: '1px solid black',
    display: 'flex',
    'flex-flow': 'row nowrap',
    padding: '8px'
};

var avatarStyle = {
    width: '50px',
    height: '50px',
    backgroundColor: 'blue',
    borderRadius: '50%'
}

var PlayerView = Yaf.View.extend({
    tagName: 'div',

    className: 'player',
    
    style: {
        'root' : cardStyle,
        'div.avatar': avatarStyle,
        'p#name': textStyle,
        'p#height': textStyle,
        'p#weight': textStyle
    },

    template: {
        'div.avatar': {},
        'div.info' : {
            'p#name': {
                ref: 'name'
            },
            'p#height': {
                ref: 'height',
                onClick: 'click:p#height'
            },
            'p#weight': {
                ref: 'weight',
                onClick: 'click:p#weight'
            }
        }
    },

    initialize: function() {
        this.render();
    },

    render: function() {
        this.el = this.renderTmpl();
    },

    renderInfo: function(info) {
        this.refIndex['name'].textContent = info.name;
        this.refIndex['height'].textContent = info.height;
        this.refIndex['weight'].textContent = info.weight;
    }
})

var testView = new PlayerView({});

document.body.appendChild(testView.el)

var testController = new PlayerCtrl({
    model: testModel,
    view: testView
});

module.exports = Player;
