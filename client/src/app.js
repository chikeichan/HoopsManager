var Player = require('./models/player/basePlayer');

var HeaderView = require('./views/header');
var HeaderController = require('./controllers/header');

var header = new HeaderController({
    view: new HeaderView({})
});