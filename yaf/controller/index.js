var EventBus = require('../eventBus');
var Controller = {};

Controller._constructor = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();
    this._initialize(opts);
};

Controller._constructor.prototype._initialize = function(opts) {
    this.model = opts.model;
    this.view = opts.view || null;

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

Controller.extend = function(methods) {
    var parent = this._constructor;
    var child = function() {
        parent.apply(this, arguments);
    }

    var extended = {};

    for (var prop in parent.prototype) {
        if (Object.prototype.hasOwnProperty.call(parent.prototype, prop)) {
            extended[prop] = parent.prototype[prop];
        }
    }

    for (var prop in methods) {
        if (Object.prototype.hasOwnProperty.call(methods, prop)) {
            extended[prop] = methods[prop];
        }
    }

    child.prototype = Object.create(extended);

    return child;
}

module.exports = Controller;