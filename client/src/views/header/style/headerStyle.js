var Trio = require('trio');
var ButtonStyle = Trio.Stylizer.Mixins('button', {width: '100%'});

module.exports = {
    ':host': {
        width: '100%',
        height: '50px',
        'background-color': '#333333',
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
        'border-radius': '50%'
    },

    'div.action-buttons': {
        display: 'flex',
        'flex-flow': 'row nowrap',
        flex: '1 1 auto',
        'justify-content': 'space-between'
    },

    'div.button': ButtonStyle,

    'div.button:hover': {
        'background-color': 'rgba(0, 156, 180, 0.5)'
    },

    'div.button:active': {
        'background-color': 'rgba(0, 156, 180, 0.9)'
    }
};