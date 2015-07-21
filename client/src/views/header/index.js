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
        },

        'div.action-buttons': {
            display: 'flex',
            'flex-flow': 'row nowrap',
            flex: '1 1 auto',
            'justify-content': 'space-between'
        },

        'div.button': {
            height: '12px',
            width: '60px',
            padding: '8px 4px',
            margin: '0 4px',
            'font-family': 'Arial',
            'font-size': '12px',
            backgroundColor: 'rgb(0, 156, 180)',
            textAlign: 'center',
            borderRadius: '2px'
        },

        'span#text': {
            color: 'white'
        }
    },

    buttonOptions: ['calendar', 'news', 'roster', 'finance'],

    template: {
        'div.info' : {},
        'div.action-buttons': {
            ref: 'buttons',
            'div.button': {
                'span#text': {}
            }
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
            button.querySelector('#text').textContent = btn;
            this.refIndex.buttons.appendChild(button);
        }.bind(this));
    }
});

module.exports = HeaderView;