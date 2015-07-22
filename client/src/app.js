var Trio = require('trio');

Trio.Stylizer.registerVariables('buttonBgColor', '0, 156, 180');
Trio.Stylizer.registerMixins('button', function(opts) {
    return {
        height: '12px',
        width: opts.width || '60px',
        padding: '8px 4px',
        margin: '0 4px',
        'font-family': 'Arial',
        'font-size': '12px',
        'background-color': 'rgba(' + Trio.Stylizer.getVariable('buttonBgColor') + ', 0.7)',
        'text-align': 'center',
        'border-radius': '2px',
        color: 'white',
        cursor: 'pointer'
    }
});

var Player = require('./models/player/basePlayer');

var HeaderView = require('./views/header');
var HeaderController = require('./controllers/header');


var header = new HeaderController({
    view: new HeaderView({})
});