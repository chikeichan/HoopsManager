(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Yaf = require('../../yaf')
var Player = require('./models/player/basePlayer');


},{"../../yaf":5,"./models/player/basePlayer":2}],2:[function(require,module,exports){
var Player = Yaf.Model.extend({
    initialize: function() {
        this.eventBus.subscribe('changed:height', function(a) {
            console.log(this, a);
        });

        this.eventBus.subscribe('running', function(a) {
            console.log('model', a);
        })
    }
});

var testModel = new Player({
    height: 62,
    weight: 178,
    speed: 8
});

var PlayerCtrl = Yaf.Controller.extend({
    run: function(num) {
        this.eventBus.publish('running', this, num);
    }
});

var PlayerView = Yaf.View.extend({
    initialize: function() {
        var player = document.createElement('div');
        player.className = 'player';
        player.style.width = '50px';
        player.style.height = '50px';
        player.style.backgroundColor = 'blue';
        player.style.borderRadius = '50%';
        document.body.appendChild(player);

        this.eventBus.subscribe('running', function(a) {
            player.style.marginLeft = a +'px';
        });
    }
})

var testView = new PlayerView({
    eventBus: testModel.eventBus
});

var testController = new PlayerCtrl({
    model: testModel,
    view: testView,
    eventBus: testModel.eventBus
});

testController.run(100);

module.exports = Player;
},{}],3:[function(require,module,exports){
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
},{"../eventBus":4}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
var Model = require('./model');
var Controller = require('./controller');
var View = require('./view');

module.exports = {
    Model: Model,
    Controller: Controller,
    View: View
}
},{"./controller":3,"./model":6,"./view":7}],6:[function(require,module,exports){
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
},{"../eventBus":4}],7:[function(require,module,exports){
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
},{"../eventBus":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvc3JjL2FwcC5qcyIsImNsaWVudC9zcmMvbW9kZWxzL3BsYXllci9iYXNlUGxheWVyLmpzIiwieWFmL2NvbnRyb2xsZXIvaW5kZXguanMiLCJ5YWYvZXZlbnRCdXMvaW5kZXguanMiLCJ5YWYvaW5kZXguanMiLCJ5YWYvbW9kZWwvaW5kZXguanMiLCJ5YWYvdmlldy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJZYWYgPSByZXF1aXJlKCcuLi8uLi95YWYnKVxudmFyIFBsYXllciA9IHJlcXVpcmUoJy4vbW9kZWxzL3BsYXllci9iYXNlUGxheWVyJyk7XG5cbiIsInZhciBQbGF5ZXIgPSBZYWYuTW9kZWwuZXh0ZW5kKHtcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5zdWJzY3JpYmUoJ2NoYW5nZWQ6aGVpZ2h0JywgZnVuY3Rpb24oYSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcywgYSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZXZlbnRCdXMuc3Vic2NyaWJlKCdydW5uaW5nJywgZnVuY3Rpb24oYSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ21vZGVsJywgYSk7XG4gICAgICAgIH0pXG4gICAgfVxufSk7XG5cbnZhciB0ZXN0TW9kZWwgPSBuZXcgUGxheWVyKHtcbiAgICBoZWlnaHQ6IDYyLFxuICAgIHdlaWdodDogMTc4LFxuICAgIHNwZWVkOiA4XG59KTtcblxudmFyIFBsYXllckN0cmwgPSBZYWYuQ29udHJvbGxlci5leHRlbmQoe1xuICAgIHJ1bjogZnVuY3Rpb24obnVtKSB7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgncnVubmluZycsIHRoaXMsIG51bSk7XG4gICAgfVxufSk7XG5cbnZhciBQbGF5ZXJWaWV3ID0gWWFmLlZpZXcuZXh0ZW5kKHtcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBwbGF5ZXIuY2xhc3NOYW1lID0gJ3BsYXllcic7XG4gICAgICAgIHBsYXllci5zdHlsZS53aWR0aCA9ICc1MHB4JztcbiAgICAgICAgcGxheWVyLnN0eWxlLmhlaWdodCA9ICc1MHB4JztcbiAgICAgICAgcGxheWVyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdibHVlJztcbiAgICAgICAgcGxheWVyLnN0eWxlLmJvcmRlclJhZGl1cyA9ICc1MCUnO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBsYXllcik7XG5cbiAgICAgICAgdGhpcy5ldmVudEJ1cy5zdWJzY3JpYmUoJ3J1bm5pbmcnLCBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICBwbGF5ZXIuc3R5bGUubWFyZ2luTGVmdCA9IGEgKydweCc7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pXG5cbnZhciB0ZXN0VmlldyA9IG5ldyBQbGF5ZXJWaWV3KHtcbiAgICBldmVudEJ1czogdGVzdE1vZGVsLmV2ZW50QnVzXG59KTtcblxudmFyIHRlc3RDb250cm9sbGVyID0gbmV3IFBsYXllckN0cmwoe1xuICAgIG1vZGVsOiB0ZXN0TW9kZWwsXG4gICAgdmlldzogdGVzdFZpZXcsXG4gICAgZXZlbnRCdXM6IHRlc3RNb2RlbC5ldmVudEJ1c1xufSk7XG5cbnRlc3RDb250cm9sbGVyLnJ1bigxMDApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjsiLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cycpO1xudmFyIENvbnRyb2xsZXIgPSB7fTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLm1vZGVsID0gb3B0cy5tb2RlbDtcbiAgICB0aGlzLnZpZXcgPSBvcHRzLnZpZXcgfHwgbnVsbDtcblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxufTtcblxuQ29udHJvbGxlci5leHRlbmQgPSBmdW5jdGlvbihtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlcjsiLCJ2YXIgRXZlbnRCdXMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2ZW50XSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbZXZlbnRdID0gW107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHBhc3NlZCBpbiB0byBzdWJzY3JpYmUnKTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5fZXZlbnRzW2V2ZW50XS5wdXNoKGZ1bmMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzKSB7XG4gICAgY3R4ID0gY3R4IHx8IHRoaXM7XG4gICAgYXJncyA9IGFyZ3MgfHwgbnVsbDtcblxuICAgIHZhciBjYlF1ZXVlID0gdGhpcy5fZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGNiUXVldWUpKSB7XG4gICAgICAgIGNiUXVldWUuZm9yRWFjaChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgY2IuY2FsbChjdHgsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50QnVzOyIsInZhciBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwnKTtcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyJyk7XG52YXIgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBNb2RlbDogTW9kZWwsXG4gICAgQ29udHJvbGxlcjogQ29udHJvbGxlcixcbiAgICBWaWV3OiBWaWV3XG59IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBNb2RlbCA9IHt9O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgaWYodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChvcHRzKTtcbiAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2luaXRpYWxpemVkJywgdGhpcywgb3B0cyk7XG4gICAgXG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGssIGtleVtrXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzW2tleV0gPSB2YWw7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlZCcsIHRoaXMsIHtrZXk6IHZhbH0pO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZWQ6JyArIGtleSwgdGhpcywgdmFsKTtcbiAgICB9XG59O1xuXG5Nb2RlbC5leHRlbmQgPSBmdW5jdGlvbihtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgaWYodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5WaWV3LmV4dGVuZCA9IGZ1bmN0aW9uKG1ldGhvZHMpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fY29uc3RydWN0b3I7XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHZhciBleHRlbmRlZCA9IHt9O1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBwYXJlbnQucHJvdG90eXBlKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocGFyZW50LnByb3RvdHlwZSwgcHJvcCkpIHtcbiAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gcGFyZW50LnByb3RvdHlwZVtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIHByb3AgaW4gbWV0aG9kcykge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1ldGhvZHMsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3OyJdfQ==
