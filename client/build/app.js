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
    events: {
        'click height': 'addHeight',
        'click weight': 'subtractWeight'
    },

    initialize: function() {
        this.eventBus.subscribe('changed', function(a) {
            this.view.postRender(this.model.attributes);
        }.bind(this));
    },

    addHeight: function() {
        var height = this.model.get('height');
        this.model.set('height', height + 1);
    },

    subtractWeight: function() {
        var weight = this.model.get('weight');
        this.model.set('weight', weight - 1);
    }
});

var textStyle = {
    'font-family': 'arial',
    margin: '4px 12px',
    'font-size': '12px'
}

var PlayerView = Yaf.View.extend({
    tagName: 'div',
    className: 'player',
    template: {
        'div.avatar': {
            style: {
                width: '50px',
                height: '50px',
                backgroundColor: 'blue',
                borderRadius: '50%'
            }
        },

        'div.info' : {
            'p#name': {
                ref: 'name',
                style: textStyle
            },
            'p#height': {
                ref: 'height',
                style: textStyle
            },
            'p#weight': {
                ref: 'weight',
                style: textStyle
            }
        },

        style: {
            width: '200px',
            height: '100px',
            backgroundColor: 'white',
            border: '1px solid black',
            display: 'flex',
            'flex-flow': 'row nowrap',
            padding: '8px'
        }
    },

    postRender: function(opts) {
        this.index['name'].textContent = opts.name;
        this.index['height'].textContent = opts.height;
        this.index['weight'].textContent = opts.weight;
    }
})

var testView = new PlayerView({
    eventBus: testModel.eventBus
});

testView.render().postRender(testModel.attributes);
document.body.appendChild(testView.el)

var testController = new PlayerCtrl({
    model: testModel,
    view: testView,
    eventBus: testModel.eventBus
});

module.exports = Player;

},{}],3:[function(require,module,exports){
var EventBus = require('../eventBus');
var Controller = {};

Controller._constructor = function(opts) {
    this._initialize(opts);
};

Controller._constructor.prototype._initialize = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();
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
        var evtEl   = this.view.index[parsed[1]];
        var evtFn   = this[this.events[evt]] = this[this.events[evt]].bind(this);
        
        evtEl.addEventListener(evtName, evtFn);
    }
};

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
    this.eventBus = opts.eventBus || new EventBus();

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.render = function() {
    var element = {};
    var index = {};
    var tagName = this.tagName || 'div';
    var className = this.className || null;

    element = {
        el: document.createElement(tagName),
    };

    if(className) {
        element.el.className = className;
    }

    index['root'] = element.el;

    createElements(this.template, element);

    this.el = element.el;
    this.index = index;

    return this;

    function createElements(template, base) {
        for (var tag in template) {
            if (isValidTag(tag)) {
                base[tag] = createOneElement(tag);
                base.el.appendChild(base[tag].el);
                createElements(template[tag], base[tag]);
            }

            if (tag === 'style') {
                addStyle(base.el, template[tag]);
            }

            if (tag === 'ref') {
                index[template[tag]] = base.el;
            }
        }
    }

    function createOneElement(tag) {
        var parsed = parseTag(tag);
        var tagName = parsed[0];

        var base = {
            el: document.createElement(tagName)
        }

        if (parsed[1] === '.') {
            base.el.className = parsed[2];
        } else if (parsed[1] === '#') {
            base.el.id = parsed[2];
        }

        return base;
    }

    function addStyle(el, style) {
        for (var attr in style) {
            el.style[attr] = style[attr];
        }
    }

    function parseTag(tag) {
        tag = tag.replace(/[.#]/, function(d) { return ',' + d + ','})
                 .split(',');
        return tag;
    }

    function isValidTag(tag) {
        return tag !== 'style' && tag !== 'ref';
    }
};

module.exports = View;
},{"../eventBus":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvc3JjL2FwcC5qcyIsImNsaWVudC9zcmMvbW9kZWxzL3BsYXllci9iYXNlUGxheWVyLmpzIiwieWFmL2NvbnRyb2xsZXIvaW5kZXguanMiLCJ5YWYvZXZlbnRCdXMvaW5kZXguanMiLCJ5YWYvaW5kZXguanMiLCJ5YWYvbW9kZWwvaW5kZXguanMiLCJ5YWYvdmlldy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJZYWYgPSByZXF1aXJlKCcuLi8uLi95YWYnKVxudmFyIFBsYXllciA9IHJlcXVpcmUoJy4vbW9kZWxzL3BsYXllci9iYXNlUGxheWVyJyk7XG5cbiIsInZhciBQbGF5ZXIgPSBZYWYuTW9kZWwuZXh0ZW5kKHt9KTtcblxudmFyIHRlc3RNb2RlbCA9IG5ldyBQbGF5ZXIoe1xuICAgIGhlaWdodDogNjIsXG4gICAgd2VpZ2h0OiAxNzgsXG4gICAgbmFtZTogJ0phY2t5IENoYW4nXG59KTtcblxudmFyIFBsYXllckN0cmwgPSBZYWYuQ29udHJvbGxlci5leHRlbmQoe1xuICAgIGV2ZW50czoge1xuICAgICAgICAnY2xpY2sgaGVpZ2h0JzogJ2FkZEhlaWdodCcsXG4gICAgICAgICdjbGljayB3ZWlnaHQnOiAnc3VidHJhY3RXZWlnaHQnXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnN1YnNjcmliZSgnY2hhbmdlZCcsIGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5wb3N0UmVuZGVyKHRoaXMubW9kZWwuYXR0cmlidXRlcyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGFkZEhlaWdodDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBoZWlnaHQgPSB0aGlzLm1vZGVsLmdldCgnaGVpZ2h0Jyk7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KCdoZWlnaHQnLCBoZWlnaHQgKyAxKTtcbiAgICB9LFxuXG4gICAgc3VidHJhY3RXZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgd2VpZ2h0ID0gdGhpcy5tb2RlbC5nZXQoJ3dlaWdodCcpO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnd2VpZ2h0Jywgd2VpZ2h0IC0gMSk7XG4gICAgfVxufSk7XG5cbnZhciB0ZXh0U3R5bGUgPSB7XG4gICAgJ2ZvbnQtZmFtaWx5JzogJ2FyaWFsJyxcbiAgICBtYXJnaW46ICc0cHggMTJweCcsXG4gICAgJ2ZvbnQtc2l6ZSc6ICcxMnB4J1xufVxuXG52YXIgUGxheWVyVmlldyA9IFlhZi5WaWV3LmV4dGVuZCh7XG4gICAgdGFnTmFtZTogJ2RpdicsXG4gICAgY2xhc3NOYW1lOiAncGxheWVyJyxcbiAgICB0ZW1wbGF0ZToge1xuICAgICAgICAnZGl2LmF2YXRhcic6IHtcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICc1MHB4JyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MHB4JyxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdibHVlJyxcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc1MCUnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2Rpdi5pbmZvJyA6IHtcbiAgICAgICAgICAgICdwI25hbWUnOiB7XG4gICAgICAgICAgICAgICAgcmVmOiAnbmFtZScsXG4gICAgICAgICAgICAgICAgc3R5bGU6IHRleHRTdHlsZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdwI2hlaWdodCc6IHtcbiAgICAgICAgICAgICAgICByZWY6ICdoZWlnaHQnLFxuICAgICAgICAgICAgICAgIHN0eWxlOiB0ZXh0U3R5bGVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncCN3ZWlnaHQnOiB7XG4gICAgICAgICAgICAgICAgcmVmOiAnd2VpZ2h0JyxcbiAgICAgICAgICAgICAgICBzdHlsZTogdGV4dFN0eWxlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIHdpZHRoOiAnMjAwcHgnLFxuICAgICAgICAgICAgaGVpZ2h0OiAnMTAwcHgnLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLFxuICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIGJsYWNrJyxcbiAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgICAgICdmbGV4LWZsb3cnOiAncm93IG5vd3JhcCcsXG4gICAgICAgICAgICBwYWRkaW5nOiAnOHB4J1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHBvc3RSZW5kZXI6IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICAgICAgdGhpcy5pbmRleFsnbmFtZSddLnRleHRDb250ZW50ID0gb3B0cy5uYW1lO1xuICAgICAgICB0aGlzLmluZGV4WydoZWlnaHQnXS50ZXh0Q29udGVudCA9IG9wdHMuaGVpZ2h0O1xuICAgICAgICB0aGlzLmluZGV4Wyd3ZWlnaHQnXS50ZXh0Q29udGVudCA9IG9wdHMud2VpZ2h0O1xuICAgIH1cbn0pXG5cbnZhciB0ZXN0VmlldyA9IG5ldyBQbGF5ZXJWaWV3KHtcbiAgICBldmVudEJ1czogdGVzdE1vZGVsLmV2ZW50QnVzXG59KTtcblxudGVzdFZpZXcucmVuZGVyKCkucG9zdFJlbmRlcih0ZXN0TW9kZWwuYXR0cmlidXRlcyk7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRlc3RWaWV3LmVsKVxuXG52YXIgdGVzdENvbnRyb2xsZXIgPSBuZXcgUGxheWVyQ3RybCh7XG4gICAgbW9kZWw6IHRlc3RNb2RlbCxcbiAgICB2aWV3OiB0ZXN0VmlldyxcbiAgICBldmVudEJ1czogdGVzdE1vZGVsLmV2ZW50QnVzXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG4iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cycpO1xudmFyIENvbnRyb2xsZXIgPSB7fTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLm1vZGVsID0gb3B0cy5tb2RlbCB8fCBudWxsO1xuICAgIHRoaXMudmlldyA9IG9wdHMudmlldyB8fCBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy5ldmVudHMpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IGV2dC5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgZXZ0TmFtZSA9IHBhcnNlZFswXTtcbiAgICAgICAgdmFyIGV2dEVsICAgPSB0aGlzLnZpZXcuaW5kZXhbcGFyc2VkWzFdXTtcbiAgICAgICAgdmFyIGV2dEZuICAgPSB0aGlzW3RoaXMuZXZlbnRzW2V2dF1dID0gdGhpc1t0aGlzLmV2ZW50c1tldnRdXS5iaW5kKHRoaXMpO1xuICAgICAgICBcbiAgICAgICAgZXZ0RWwuYWRkRXZlbnRMaXN0ZW5lcihldnROYW1lLCBldnRGbik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyOyIsInZhciBFdmVudEJ1cyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZlbnRdKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1tldmVudF0gPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGNhbGxiYWNrIGZ1bmN0aW9uIG11c3QgYmUgcGFzc2VkIGluIHRvIHN1YnNjcmliZScpO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLl9ldmVudHNbZXZlbnRdLnB1c2goZnVuYyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MpIHtcbiAgICBjdHggPSBjdHggfHwgbnVsbDtcbiAgICBhcmdzID0gYXJncyB8fCBudWxsO1xuXG4gICAgdmFyIGNiUXVldWUgPSB0aGlzLl9ldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2JRdWV1ZSkpIHtcbiAgICAgICAgY2JRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICBjYi5jYWxsKHRoaXMsIGN0eCwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRCdXM7IiwidmFyIE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXInKTtcbnZhciBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbnZhciBZYWYgPSB7XG4gICAgTW9kZWw6IE1vZGVsLFxuICAgIENvbnRyb2xsZXI6IENvbnRyb2xsZXIsXG4gICAgVmlldzogVmlld1xufVxuXG5cbmZvciAodmFyIGtleSBpbiBZYWYpIHtcbiAgICBZYWZba2V5XS5leHRlbmQgPSBleHRlbmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWWFmO1xuXG5mdW5jdGlvbiBleHRlbmQobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBNb2RlbCA9IHt9O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG5cbiAgICBpZih0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0KG9wdHMpO1xuICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnaW5pdGlhbGl6ZWQnLCB0aGlzLCBvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICBmb3IgKHZhciBrIGluIGtleSkge1xuICAgICAgICAgICAgdGhpcy5zZXQoaywga2V5W2tdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXNba2V5XSA9IHZhbDtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2VkJywgdGhpcywge2tleTogdmFsfSk7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlZDonICsga2V5LCB0aGlzLCB2YWwpO1xuICAgIH1cbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNba2V5XTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsOyIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzJyk7XG52YXIgVmlldyA9IHt9O1xuXG5WaWV3Ll9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuXG4gICAgaWYodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB7fTtcbiAgICB2YXIgaW5kZXggPSB7fTtcbiAgICB2YXIgdGFnTmFtZSA9IHRoaXMudGFnTmFtZSB8fCAnZGl2JztcbiAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWUgfHwgbnVsbDtcblxuICAgIGVsZW1lbnQgPSB7XG4gICAgICAgIGVsOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpLFxuICAgIH07XG5cbiAgICBpZihjbGFzc05hbWUpIHtcbiAgICAgICAgZWxlbWVudC5lbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgaW5kZXhbJ3Jvb3QnXSA9IGVsZW1lbnQuZWw7XG5cbiAgICBjcmVhdGVFbGVtZW50cyh0aGlzLnRlbXBsYXRlLCBlbGVtZW50KTtcblxuICAgIHRoaXMuZWwgPSBlbGVtZW50LmVsO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudHModGVtcGxhdGUsIGJhc2UpIHtcbiAgICAgICAgZm9yICh2YXIgdGFnIGluIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZFRhZyh0YWcpKSB7XG4gICAgICAgICAgICAgICAgYmFzZVt0YWddID0gY3JlYXRlT25lRWxlbWVudCh0YWcpO1xuICAgICAgICAgICAgICAgIGJhc2UuZWwuYXBwZW5kQ2hpbGQoYmFzZVt0YWddLmVsKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cyh0ZW1wbGF0ZVt0YWddLCBiYXNlW3RhZ10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICAgICAgYWRkU3R5bGUoYmFzZS5lbCwgdGVtcGxhdGVbdGFnXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdyZWYnKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlLmVsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBiYXNlID0ge1xuICAgICAgICAgICAgZWw6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJzZWRbMV0gPT09ICcuJykge1xuICAgICAgICAgICAgYmFzZS5lbC5jbGFzc05hbWUgPSBwYXJzZWRbMl07XG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VkWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGJhc2UuZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmFzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRTdHlsZShlbCwgc3R5bGUpIHtcbiAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBzdHlsZSkge1xuICAgICAgICAgICAgZWwuc3R5bGVbYXR0cl0gPSBzdHlsZVthdHRyXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVGFnKHRhZykge1xuICAgICAgICB0YWcgPSB0YWcucmVwbGFjZSgvWy4jXS8sIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICcsJyArIGQgKyAnLCd9KVxuICAgICAgICAgICAgICAgICAuc3BsaXQoJywnKTtcbiAgICAgICAgcmV0dXJuIHRhZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1ZhbGlkVGFnKHRhZykge1xuICAgICAgICByZXR1cm4gdGFnICE9PSAnc3R5bGUnICYmIHRhZyAhPT0gJ3JlZic7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3OyJdfQ==
