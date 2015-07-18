var EventBus = require('../eventBus');
var Model = {};

Model._constructor = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();
    this.attributes = {};
    this._initialize(opts);
};

Model._constructor.prototype._initialize = function(opts) {
    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }

    this.set(opts);
    this.eventBus.publish('initialized', this, opts);
    
};

Model._constructor.prototype.set = function(key, val) {
    if (typeof key === 'object' && !Array.isArray(key)) {
        for (var k in key) {
            this.set(k, key[k]);
        }
    }

    if (typeof key === 'string') {
        this.attributes[key] = val;
        this.eventBus.publish('changed', this, {key: val});
        this.eventBus.publish('changed:' + key, this, val);
    }
};

Model.extend = function(methods) {
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

module.exports = Model;