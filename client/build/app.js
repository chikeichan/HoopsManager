(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Yaf = require('../../yaf')
var Player = require('./models/player/basePlayer');


},{"../../yaf":5,"./models/player/basePlayer":2}],2:[function(require,module,exports){
var Player = Yaf.Model.extend({});

var testModel = new Player({
    height: 62,
    weight: 178,
    name: 'Jacky Chan'
});

var PlayerCtrl = Yaf.Controller.extend({
    viewEvents: {
        'click:p#height': 'addHeight',
        'click:p#weight': 'subtractWeight'
    },

    modelEvents: {
        'changed': 'updateInfo'
    },

    initialize: function() {
        this.updateInfo();
    },

    addHeight: function() {
        var height = this.model.get('height');
        this.model.set('height', height + 1);
    },

    subtractWeight: function() {
        var weight = this.model.get('weight');
        this.model.set('weight', weight - 1);
    },

    updateInfo: function() {
        this.view.renderInfo(this.model.attributes);
    }
});

var textStyle = {
    'font-family': 'arial',
    margin: '4px 12px',
    'font-size': '12px'
};

var cardStyle = {
    width: '200px',
    height: '100px',
    backgroundColor: 'white',
    border: '1px solid black',
    display: 'flex',
    'flex-flow': 'row nowrap',
    padding: '8px'
};

var avatarStyle = {
    width: '50px',
    height: '50px',
    backgroundColor: 'blue',
    borderRadius: '50%'
}

var PlayerView = Yaf.View.extend({
    tagName: 'div',
    className: 'player',
    style: {
        'root' : cardStyle,
        'div.avatar': avatarStyle,
        'p#name': textStyle,
        'p#height': textStyle,
        'p#weight': textStyle
    },
    template: {
        'div.avatar': {},
        'div.info' : {
            'p#name': {
                ref: 'name'
            },
            'p#height': {
                ref: 'height',
                onClick: 'click:p#height'
            },
            'p#weight': {
                ref: 'weight',
                onClick: 'click:p#weight'
            }
        }
    },

    initialize: function() {
        this.render();
    },

    render: function() {
        this.el = this.renderTmpl();
    },

    renderInfo: function(info) {
        this.refIndex['name'].textContent = info.name;
        this.refIndex['height'].textContent = info.height;
        this.refIndex['weight'].textContent = info.weight;
    }
})

var testView = new PlayerView({});

document.body.appendChild(testView.el)

var testController = new PlayerCtrl({
    model: testModel,
    view: testView
});

module.exports = Player;

},{}],3:[function(require,module,exports){
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
    for (var evt in this.viewEvents) {
        var handler = this.viewEvents[evt];
        var fn = this[handler] = this[handler].bind(this)
        this.view.eventBus.subscribe(evt, fn);
    }

    for (var evt in this.modelEvents) {
        var handler = this.modelEvents[evt];
        var fn = this[handler] = this[handler].bind(this)
        this.model.eventBus.subscribe(evt, fn);
    }
};

module.exports = Controller;
},{}],4:[function(require,module,exports){
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
    ctx = ctx || null;
    args = args || null;

    var cbQueue = this._events[event];

    if (Array.isArray(cbQueue)) {
        cbQueue.forEach(function(cb) {
            cb.call(this, ctx, args);
        });
    }
};

module.exports = EventBus;
},{}],5:[function(require,module,exports){
var Model = require('./model');
var Controller = require('./controller');
var View = require('./view');

var Yaf = {
    Model: Model,
    Controller: Controller,
    View: View
}


for (var key in Yaf) {
    Yaf[key].extend = extend;
}

module.exports = Yaf;

function extend(methods) {
    var parent = this._constructor;
    var staticAttr = {};
    var child = function() {
        for (var key in staticAttr) {
            this[key] = staticAttr[key];
        }
        parent.apply(this, arguments);
    };
    
    var extended = {};

    for (var prop in parent.prototype) {
        if (Object.prototype.hasOwnProperty.call(parent.prototype, prop)) {
            extended[prop] = parent.prototype[prop];
        }
    }

    for (var prop in methods) {
        if (Object.prototype.hasOwnProperty.call(methods, prop)) {
            var method = methods[prop];
            if (typeof method === 'function') {
                extended[prop] = methods[prop];
            } else {
                staticAttr[prop] = methods[prop];
            }
        }
    }

    child.prototype = Object.create(extended);

    return child;
}
},{"./controller":3,"./model":6,"./view":7}],6:[function(require,module,exports){
var EventBus = require('../eventBus');
var Model = {};

Model._constructor = function(opts) {
    this.attributes = {};
    this._initialize(opts);
};

Model._constructor.prototype._initialize = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();

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

Model._constructor.prototype.get = function(key) {
    if (typeof key === 'string') {
        return this.attributes[key];
    }
};

module.exports = Model;
},{"../eventBus":4}],7:[function(require,module,exports){
var EventBus = require('../eventBus');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    this.refIndex = {};

    this.eventBus = opts.eventBus || new EventBus();

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.renderTmpl = function(tag, template) {
    var el;

    template = template || this.template;

    if (!tag) {
        el = document.createElement(this.tagName);

        if (this.className) {
            el.className = this.className;
        }

        if (this.style['root']) {
            addStyle(el, this.style['root']);
        }

    } else {
        el = createOneElement(tag);
    }

    createElements.call(this, template, el);

    return el;

    function createElements(template, base) {
        for (var tag in template) {
            if (isValidTag(tag)) {
                var el = createOneElement(tag);
                base.appendChild(el)
                if (this.style[tag]) {
                    addStyle(el, this.style[tag]);
                }
                createElements.call(this, template[tag], el);
            }

            if (tag === 'ref') {
                this.refIndex[template[tag]] = base;
            }

            if (tag === 'onClick') {
                addEvents.call(this, base, 'click' ,template[tag]);
            }
        }
    }

    function createOneElement(tag) {
        var parsed = parseTag(tag);
        var tagName = parsed[0];

        var el = document.createElement(tagName)

        if (parsed[1] === '.') {
            el.className = parsed[2];
        } else if (parsed[1] === '#') {
            el.id = parsed[2];
        }

        return el;
    }

    function addStyle(el, style) {
        for (var attr in style) {
            el.style[attr] = style[attr];
        }
    }

    function addEvents(el, originEvt, newEvt) {
        el.addEventListener(originEvt, function(e) {
            this.eventBus.publish(newEvt, this, e);
        }.bind(this));
    }

    function parseTag(tag) {
        tag = tag.replace(/[.#]/, function(d) { return ',' + d + ','})
                 .split(',');
        return tag;
    }

    function isValidTag(tag) {
        return tag !== 'style' && tag !== 'ref' && tag !== 'onClick';
    }
};

module.exports = View;

},{"../eventBus":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvc3JjL2FwcC5qcyIsImNsaWVudC9zcmMvbW9kZWxzL3BsYXllci9iYXNlUGxheWVyLmpzIiwieWFmL2NvbnRyb2xsZXIvaW5kZXguanMiLCJ5YWYvZXZlbnRCdXMvaW5kZXguanMiLCJ5YWYvaW5kZXguanMiLCJ5YWYvbW9kZWwvaW5kZXguanMiLCJ5YWYvdmlldy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJZYWYgPSByZXF1aXJlKCcuLi8uLi95YWYnKVxudmFyIFBsYXllciA9IHJlcXVpcmUoJy4vbW9kZWxzL3BsYXllci9iYXNlUGxheWVyJyk7XG5cbiIsInZhciBQbGF5ZXIgPSBZYWYuTW9kZWwuZXh0ZW5kKHt9KTtcblxudmFyIHRlc3RNb2RlbCA9IG5ldyBQbGF5ZXIoe1xuICAgIGhlaWdodDogNjIsXG4gICAgd2VpZ2h0OiAxNzgsXG4gICAgbmFtZTogJ0phY2t5IENoYW4nXG59KTtcblxudmFyIFBsYXllckN0cmwgPSBZYWYuQ29udHJvbGxlci5leHRlbmQoe1xuICAgIHZpZXdFdmVudHM6IHtcbiAgICAgICAgJ2NsaWNrOnAjaGVpZ2h0JzogJ2FkZEhlaWdodCcsXG4gICAgICAgICdjbGljazpwI3dlaWdodCc6ICdzdWJ0cmFjdFdlaWdodCdcbiAgICB9LFxuXG4gICAgbW9kZWxFdmVudHM6IHtcbiAgICAgICAgJ2NoYW5nZWQnOiAndXBkYXRlSW5mbydcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudXBkYXRlSW5mbygpO1xuICAgIH0sXG5cbiAgICBhZGRIZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5tb2RlbC5nZXQoJ2hlaWdodCcpO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnaGVpZ2h0JywgaGVpZ2h0ICsgMSk7XG4gICAgfSxcblxuICAgIHN1YnRyYWN0V2VpZ2h0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHdlaWdodCA9IHRoaXMubW9kZWwuZ2V0KCd3ZWlnaHQnKTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ3dlaWdodCcsIHdlaWdodCAtIDEpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVJbmZvOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy52aWV3LnJlbmRlckluZm8odGhpcy5tb2RlbC5hdHRyaWJ1dGVzKTtcbiAgICB9XG59KTtcblxudmFyIHRleHRTdHlsZSA9IHtcbiAgICAnZm9udC1mYW1pbHknOiAnYXJpYWwnLFxuICAgIG1hcmdpbjogJzRweCAxMnB4JyxcbiAgICAnZm9udC1zaXplJzogJzEycHgnXG59O1xuXG52YXIgY2FyZFN0eWxlID0ge1xuICAgIHdpZHRoOiAnMjAwcHgnLFxuICAgIGhlaWdodDogJzEwMHB4JyxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScsXG4gICAgYm9yZGVyOiAnMXB4IHNvbGlkIGJsYWNrJyxcbiAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgJ2ZsZXgtZmxvdyc6ICdyb3cgbm93cmFwJyxcbiAgICBwYWRkaW5nOiAnOHB4J1xufTtcblxudmFyIGF2YXRhclN0eWxlID0ge1xuICAgIHdpZHRoOiAnNTBweCcsXG4gICAgaGVpZ2h0OiAnNTBweCcsXG4gICAgYmFja2dyb3VuZENvbG9yOiAnYmx1ZScsXG4gICAgYm9yZGVyUmFkaXVzOiAnNTAlJ1xufVxuXG52YXIgUGxheWVyVmlldyA9IFlhZi5WaWV3LmV4dGVuZCh7XG4gICAgdGFnTmFtZTogJ2RpdicsXG4gICAgY2xhc3NOYW1lOiAncGxheWVyJyxcbiAgICBzdHlsZToge1xuICAgICAgICAncm9vdCcgOiBjYXJkU3R5bGUsXG4gICAgICAgICdkaXYuYXZhdGFyJzogYXZhdGFyU3R5bGUsXG4gICAgICAgICdwI25hbWUnOiB0ZXh0U3R5bGUsXG4gICAgICAgICdwI2hlaWdodCc6IHRleHRTdHlsZSxcbiAgICAgICAgJ3Ajd2VpZ2h0JzogdGV4dFN0eWxlXG4gICAgfSxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICAnZGl2LmF2YXRhcic6IHt9LFxuICAgICAgICAnZGl2LmluZm8nIDoge1xuICAgICAgICAgICAgJ3AjbmFtZSc6IHtcbiAgICAgICAgICAgICAgICByZWY6ICduYW1lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdwI2hlaWdodCc6IHtcbiAgICAgICAgICAgICAgICByZWY6ICdoZWlnaHQnLFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6ICdjbGljazpwI2hlaWdodCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncCN3ZWlnaHQnOiB7XG4gICAgICAgICAgICAgICAgcmVmOiAnd2VpZ2h0JyxcbiAgICAgICAgICAgICAgICBvbkNsaWNrOiAnY2xpY2s6cCN3ZWlnaHQnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWwgPSB0aGlzLnJlbmRlclRtcGwoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVySW5mbzogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLnJlZkluZGV4WyduYW1lJ10udGV4dENvbnRlbnQgPSBpbmZvLm5hbWU7XG4gICAgICAgIHRoaXMucmVmSW5kZXhbJ2hlaWdodCddLnRleHRDb250ZW50ID0gaW5mby5oZWlnaHQ7XG4gICAgICAgIHRoaXMucmVmSW5kZXhbJ3dlaWdodCddLnRleHRDb250ZW50ID0gaW5mby53ZWlnaHQ7XG4gICAgfVxufSlcblxudmFyIHRlc3RWaWV3ID0gbmV3IFBsYXllclZpZXcoe30pO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRlc3RWaWV3LmVsKVxuXG52YXIgdGVzdENvbnRyb2xsZXIgPSBuZXcgUGxheWVyQ3RybCh7XG4gICAgbW9kZWw6IHRlc3RNb2RlbCxcbiAgICB2aWV3OiB0ZXN0Vmlld1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuIiwidmFyIENvbnRyb2xsZXIgPSB7fTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLm1vZGVsID0gb3B0cy5tb2RlbCB8fCBudWxsO1xuICAgIHRoaXMudmlldyA9IG9wdHMudmlldyB8fCBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy52aWV3RXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy52aWV3RXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGhpcy52aWV3LmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy5tb2RlbEV2ZW50cykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMubW9kZWxFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLm1vZGVsLmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7IiwidmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldmVudF0pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuX2V2ZW50c1tldmVudF0ucHVzaChmdW5jKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncykge1xuICAgIGN0eCA9IGN0eCB8fCBudWxsO1xuICAgIGFyZ3MgPSBhcmdzIHx8IG51bGw7XG5cbiAgICB2YXIgY2JRdWV1ZSA9IHRoaXMuX2V2ZW50c1tldmVudF07XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShjYlF1ZXVlKSkge1xuICAgICAgICBjYlF1ZXVlLmZvckVhY2goZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1czsiLCJ2YXIgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlcicpO1xudmFyIFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxudmFyIFlhZiA9IHtcbiAgICBNb2RlbDogTW9kZWwsXG4gICAgQ29udHJvbGxlcjogQ29udHJvbGxlcixcbiAgICBWaWV3OiBWaWV3XG59XG5cblxuZm9yICh2YXIga2V5IGluIFlhZikge1xuICAgIFlhZltrZXldLmV4dGVuZCA9IGV4dGVuZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBZYWY7XG5cbmZ1bmN0aW9uIGV4dGVuZChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn0iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cycpO1xudmFyIE1vZGVsID0ge307XG5cbk1vZGVsLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQob3B0cyk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplZCcsIHRoaXMsIG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNldChrLCBrZXlba10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1trZXldID0gdmFsO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZWQnLCB0aGlzLCB7a2V5OiB2YWx9KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2VkOicgKyBrZXksIHRoaXMsIHZhbCk7XG4gICAgfVxufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlc1trZXldO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuXG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG5cbiAgICBpZih0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXJUbXBsID0gZnVuY3Rpb24odGFnLCB0ZW1wbGF0ZSkge1xuICAgIHZhciBlbDtcblxuICAgIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwgdGhpcy50ZW1wbGF0ZTtcblxuICAgIGlmICghdGFnKSB7XG4gICAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLnRhZ05hbWUpO1xuXG4gICAgICAgIGlmICh0aGlzLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdHlsZVsncm9vdCddKSB7XG4gICAgICAgICAgICBhZGRTdHlsZShlbCwgdGhpcy5zdHlsZVsncm9vdCddKTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWwgPSBjcmVhdGVPbmVFbGVtZW50KHRhZyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZSwgZWwpO1xuXG4gICAgcmV0dXJuIGVsO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudHModGVtcGxhdGUsIGJhc2UpIHtcbiAgICAgICAgZm9yICh2YXIgdGFnIGluIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZFRhZyh0YWcpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gY3JlYXRlT25lRWxlbWVudCh0YWcpO1xuICAgICAgICAgICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWwpXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3R5bGVbdGFnXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRTdHlsZShlbCwgdGhpcy5zdHlsZVt0YWddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZVt0YWddLCBlbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdyZWYnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZJbmRleFt0ZW1wbGF0ZVt0YWddXSA9IGJhc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdvbkNsaWNrJykge1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50cy5jYWxsKHRoaXMsIGJhc2UsICdjbGljaycgLHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSlcblxuICAgICAgICBpZiAocGFyc2VkWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHBhcnNlZFsyXTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZWRbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU3R5bGUoZWwsIHN0eWxlKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGVsLnN0eWxlW2F0dHJdID0gc3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFdmVudHMoZWwsIG9yaWdpbkV2dCwgbmV3RXZ0KSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIob3JpZ2luRXZ0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2gobmV3RXZ0LCB0aGlzLCBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgcmV0dXJuIHRhZyAhPT0gJ3N0eWxlJyAmJiB0YWcgIT09ICdyZWYnICYmIHRhZyAhPT0gJ29uQ2xpY2snO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiJdfQ==
