var EventBus = function() {
    this._events = {};
};

EventBus.prototype.subscribe = function(event, func) {
    if (!this._events[event]) {
        this._events[event] = [];
    }

    if (typeof func !== 'function') {
        throw new Error('A callback function must be passed in to subscribe');
    }
    
    this._events[event].push(func);
};

EventBus.prototype.publish = function(event, ctx, args) {
    ctx = ctx || this;
    args = args || null;

    var cbQueue = this._events[event];

    if (Array.isArray(cbQueue)) {
        cbQueue.forEach(function(cb) {
            cb.call(ctx, args);
        });
    }
};

module.exports = EventBus;