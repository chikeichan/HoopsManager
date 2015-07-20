var Controller = {};

Controller._constructor = function(opts) {
    this._initialize(opts);
};

Controller._constructor.prototype._initialize = function(opts) {
    this.model = opts.model || null;
    this.view = opts.view || null;

    if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }

    this._addEventListeners();
};

Controller._constructor.prototype._addEventListeners = function() {
    for (var evt in this.events) {
        var parsed = evt.split(' ');
        var evtName = parsed[0];
        var evtEl   = this.view.refIndex[parsed[1]];
        var evtFn   = this[this.events[evt]] = this[this.events[evt]].bind(this);
        
        evtEl.addEventListener(evtName, evtFn);
    }
};

module.exports = Controller;