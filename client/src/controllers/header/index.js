var Trio = require('trio');

var HeaderCtrl = Trio.Controller.extend({
    initialize: function() {
        this.view.render();
        this.view.appendComponentTo(document.body);
    }
});

module.exports = HeaderCtrl;