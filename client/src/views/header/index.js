var Trio = require('trio');

var HeaderView = Trio.View.extend({
    className: 'hoops-header',

    style: {
        root: {
            width: '100%',
            height: '50px',
            backgroundColor: '#333333',
            margin: '0',
            display: 'flex',
            'flex-flow': 'row nowrap',
            'align-items': 'center'
        },

        'div.info': {
            height: '36px',
            width: '36px',
            margin: '4px',
            background: 'url(http://sportsunbiased.com/wp-content/uploads/2014/12/lebron-james.png) no-repeat center',
            borderRadius: '50%'
        }
    },

    buttonOptions: ['calendar', 'news', 'roster', 'finance'],

    template: {
        'div.info' : {},
        'div.action-buttons': {
            ref: 'buttons',
            'div.button': {}
        },
        'div.preferences': {}
    },

    render: function() {
        this.el = this.renderTmpl();
        this.renderButtons();
    },

    renderButtons: function() {
        if (!this.refIndex.buttons) {
            console.error('Need to render template first');
            return;
        }

        this.refIndex.buttons.innerHTML = '';

        this.buttonOptions.forEach( function(btn) {
            var buttonTmpl = this.template['div.action-buttons']['div.button'];
            var button = this.renderTmpl('div.button', buttonTmpl);
            this.addClass(button, btn);
            this.refIndex.buttons.appendChild(button);
        }.bind(this));
    }
});

module.exports = HeaderView;