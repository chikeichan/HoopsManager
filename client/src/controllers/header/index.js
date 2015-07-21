var Trio = require('trio');

var HeaderCtrl = Trio.Controller.extend({
    initialize: function() {
        this.view.render();
        document.body.appendChild(this.view.el);
    }
});

module.exports = HeaderCtrl;