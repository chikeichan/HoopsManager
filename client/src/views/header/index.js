var Trio = require('trio');
var HeaderStyle = require('./style/HeaderStyle');

var HeaderView = Trio.View.extend({
    tagName: 'hoops-header',

    buttonOptions: ['calendar', 'news', 'roster', 'finance'],

    style: HeaderStyle,

    template: {
        'div.info' : {},
        'div.action-buttons': {
            ref: 'buttonsContainer',
            'div.button': {
                ref: 'buttonTmpl'
            }
        },
        'div.preferences': {}
    },

    render: function() {
        this.renderButtons();
    },

    renderButtons: function() {
        this.refIndex.buttonsContainer.innerHTML = '';

        this.buttonOptions.forEach( function(btn) {
            var button = this.refIndex.buttonTmpl.cloneNode(true);
            this.addClass(button, btn);
            button.textContent = btn;
            this.refIndex.buttonsContainer.appendChild(button);
        }.bind(this));
    }
});

module.exports = HeaderView;
