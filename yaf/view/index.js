var EventBus = require('../eventBus');
var View = {};

View._constructor = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View.extend = function(methods) {
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

module.exports = View;