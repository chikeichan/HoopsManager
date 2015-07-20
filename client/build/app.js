(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Yaf = require('../../yaf')
var Player = require('./models/player/basePlayer');


},{"../../yaf":6,"./models/player/basePlayer":2}],2:[function(require,module,exports){
var Player = Yaf.Model.extend({});

testModel = new Player({
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
        this.view.renderInfo(this.model.read());
    }
});

var textStyle = {
    'font-family': 'arial',
    margin: '4px 12px',
    'font-size': '12px',
    cursor: 'pointer'
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
var IdGenerator = require('../helpers/IdGenerator')('controller');
var Controller = {};

Controller._constructor = function(opts) {
    this._initialize(opts);
};

Controller._constructor.prototype._initialize = function(opts) {
    this.id = IdGenerator();
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
},{"../helpers/IdGenerator":5}],4:[function(require,module,exports){
var EventBus = function() {
};

EventBus.prototype.register = function(id) {
    var id = id;
    var events = {};
    this.subscribe = function(event, func) {
        this._subscribe(event, func, id, events);
    };
    this.publish = function(event, ctx, args) {
        this._publish(event, ctx, args, events);
    };
    this.unsubscribe = function(event, func) {
        this._unsubscribe(event, func, id, events);
    };
    this.unsubscribeAll = function(event) {
        this._unsubscribeAll(event, id, events);
    }
};

EventBus.prototype._subscribe = function(event, func, id, events) {
    if (!events[event]) {
        events[event] = {};
    }

    if (!events[event][id]) {
        events[event][id] = [];
    }

    if (typeof func !== 'function') {
        throw new Error('A callback function must be passed in to subscribe');
    }
    
    events[event][id].push(func);
};

EventBus.prototype._publish = function(event, ctx, args, events) {
    ctx = ctx || null;
    args = args || null;

    var eventBucket = events[event];

    if (eventBucket) {
        for (var bucket in eventBucket) {
            var cbQueue = eventBucket[bucket];
            if (Array.isArray(cbQueue)) {
                cbQueue.forEach(function(cb) {
                    cb.call(this, ctx, args);
                });
            }
        }
    }
};

EventBus.prototype._unsubscribe = function(event, func, id, events) {
    var bucket = events[event];

    if (bucket) {
        var queue = bucket[id];

        queue.forEach(function(fn, i) {
            if(fn === func) {
                queue.splice(i, 1);
                return;
            }
        }.bind(this));
    }
};

EventBus.prototype._unsubscribeAll = function(event, id, events) {
    if (event) {
        unsubsribeOne(event);
        return;
    } 

    for (var evt in events) {
        unsubsribeOne(evt);
    }

    function unsubsribeOne(event) {
        var bucket = events[event];

        if (bucket && bucket[id]) {
            delete bucket[id];
        }
    }
};

module.exports = EventBus;

},{}],5:[function(require,module,exports){
module.exports = function(str) {
    var count = 1;

    return function() {
        var id = str + count;
        count++;
        return id;
    }
};


},{}],6:[function(require,module,exports){
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
},{"./controller":3,"./model":7,"./view":8}],7:[function(require,module,exports){
var EventBus = require('../eventBus');
var IdGenerator = require('../helpers/IdGenerator')('model');
var Model = {};

Model._constructor = function(opts) {
    this._initialize(opts);
};

Model._constructor.prototype._initialize = function(opts) {
    var attributes = {};
    this.id = IdGenerator();
    this.eventBus = opts.eventBus || new EventBus();
    this.eventBus.register(this.id);

    this.set = function(key, val) {
        this._set(key, val, attributes);
    }

    this.get = function(key) {
        return this._get(key, attributes);
    }

    this.read = function() {
        return JSON.parse(JSON.stringify(attributes));
    }

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }

    this.set(opts);
    this.eventBus.publish('initialized', this, opts);
};

Model._constructor.prototype._set = function(key, val, attributes) {
    if (typeof key === 'object' && !Array.isArray(key)) {
        for (var k in key) {
            this._set(k, key[k], attributes);
        }
    }

    if (typeof key === 'string') {
        attributes[key] = val;
        this.eventBus.publish('changed', this, {key: val});
        this.eventBus.publish('changed:' + key, this, val);
    }
};

Model._constructor.prototype._get = function(key, attributes) {
    if (typeof key === 'string') {
        return attributes[key];
    }
};

module.exports = Model;
},{"../eventBus":4,"../helpers/IdGenerator":5}],8:[function(require,module,exports){
var EventBus = require('../eventBus');
var IdGenerator = require('../helpers/IdGenerator')('view');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    this.id = IdGenerator();
    this.refIndex = {};

    this.eventBus = opts.eventBus || new EventBus();
    this.eventBus.register(this.id);

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

View._constructor.prototype.destroy = function() {
    this.el.remove();
    this.el = null;
    this.refIndex = {};
    this.eventBus.unsubscribeAll();
};

module.exports = View;

},{"../eventBus":4,"../helpers/IdGenerator":5}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvc3JjL2FwcC5qcyIsImNsaWVudC9zcmMvbW9kZWxzL3BsYXllci9iYXNlUGxheWVyLmpzIiwieWFmL2NvbnRyb2xsZXIvaW5kZXguanMiLCJ5YWYvZXZlbnRCdXMvaW5kZXguanMiLCJ5YWYvaGVscGVycy9JZEdlbmVyYXRvci5qcyIsInlhZi9pbmRleC5qcyIsInlhZi9tb2RlbC9pbmRleC5qcyIsInlhZi92aWV3L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJZYWYgPSByZXF1aXJlKCcuLi8uLi95YWYnKVxudmFyIFBsYXllciA9IHJlcXVpcmUoJy4vbW9kZWxzL3BsYXllci9iYXNlUGxheWVyJyk7XG5cbiIsInZhciBQbGF5ZXIgPSBZYWYuTW9kZWwuZXh0ZW5kKHt9KTtcblxudGVzdE1vZGVsID0gbmV3IFBsYXllcih7XG4gICAgaGVpZ2h0OiA2MixcbiAgICB3ZWlnaHQ6IDE3OCxcbiAgICBuYW1lOiAnSmFja3kgQ2hhbidcbn0pO1xuXG52YXIgUGxheWVyQ3RybCA9IFlhZi5Db250cm9sbGVyLmV4dGVuZCh7XG4gICAgdmlld0V2ZW50czoge1xuICAgICAgICAnY2xpY2s6cCNoZWlnaHQnOiAnYWRkSGVpZ2h0JyxcbiAgICAgICAgJ2NsaWNrOnAjd2VpZ2h0JzogJ3N1YnRyYWN0V2VpZ2h0J1xuICAgIH0sXG5cbiAgICBtb2RlbEV2ZW50czoge1xuICAgICAgICAnY2hhbmdlZCc6ICd1cGRhdGVJbmZvJ1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51cGRhdGVJbmZvKCk7XG4gICAgfSxcblxuICAgIGFkZEhlaWdodDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBoZWlnaHQgPSB0aGlzLm1vZGVsLmdldCgnaGVpZ2h0Jyk7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KCdoZWlnaHQnLCBoZWlnaHQgKyAxKTtcbiAgICB9LFxuXG4gICAgc3VidHJhY3RXZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgd2VpZ2h0ID0gdGhpcy5tb2RlbC5nZXQoJ3dlaWdodCcpO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnd2VpZ2h0Jywgd2VpZ2h0IC0gMSk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUluZm86IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZpZXcucmVuZGVySW5mbyh0aGlzLm1vZGVsLnJlYWQoKSk7XG4gICAgfVxufSk7XG5cbnZhciB0ZXh0U3R5bGUgPSB7XG4gICAgJ2ZvbnQtZmFtaWx5JzogJ2FyaWFsJyxcbiAgICBtYXJnaW46ICc0cHggMTJweCcsXG4gICAgJ2ZvbnQtc2l6ZSc6ICcxMnB4JyxcbiAgICBjdXJzb3I6ICdwb2ludGVyJ1xufTtcblxudmFyIGNhcmRTdHlsZSA9IHtcbiAgICB3aWR0aDogJzIwMHB4JyxcbiAgICBoZWlnaHQ6ICcxMDBweCcsXG4gICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLFxuICAgIGJvcmRlcjogJzFweCBzb2xpZCBibGFjaycsXG4gICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICdmbGV4LWZsb3cnOiAncm93IG5vd3JhcCcsXG4gICAgcGFkZGluZzogJzhweCdcbn07XG5cbnZhciBhdmF0YXJTdHlsZSA9IHtcbiAgICB3aWR0aDogJzUwcHgnLFxuICAgIGhlaWdodDogJzUwcHgnLFxuICAgIGJhY2tncm91bmRDb2xvcjogJ2JsdWUnLFxuICAgIGJvcmRlclJhZGl1czogJzUwJSdcbn1cblxudmFyIFBsYXllclZpZXcgPSBZYWYuVmlldy5leHRlbmQoe1xuICAgIHRhZ05hbWU6ICdkaXYnLFxuXG4gICAgY2xhc3NOYW1lOiAncGxheWVyJyxcblxuICAgIHN0eWxlOiB7XG4gICAgICAgICdyb290JyA6IGNhcmRTdHlsZSxcbiAgICAgICAgJ2Rpdi5hdmF0YXInOiBhdmF0YXJTdHlsZSxcbiAgICAgICAgJ3AjbmFtZSc6IHRleHRTdHlsZSxcbiAgICAgICAgJ3AjaGVpZ2h0JzogdGV4dFN0eWxlLFxuICAgICAgICAncCN3ZWlnaHQnOiB0ZXh0U3R5bGVcbiAgICB9LFxuXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgJ2Rpdi5hdmF0YXInOiB7fSxcbiAgICAgICAgJ2Rpdi5pbmZvJyA6IHtcbiAgICAgICAgICAgICdwI25hbWUnOiB7XG4gICAgICAgICAgICAgICAgcmVmOiAnbmFtZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncCNoZWlnaHQnOiB7XG4gICAgICAgICAgICAgICAgcmVmOiAnaGVpZ2h0JyxcbiAgICAgICAgICAgICAgICBvbkNsaWNrOiAnY2xpY2s6cCNoZWlnaHQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3Ajd2VpZ2h0Jzoge1xuICAgICAgICAgICAgICAgIHJlZjogJ3dlaWdodCcsXG4gICAgICAgICAgICAgICAgb25DbGljazogJ2NsaWNrOnAjd2VpZ2h0J1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVsID0gdGhpcy5yZW5kZXJUbXBsKCk7XG4gICAgfSxcblxuICAgIHJlbmRlckluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5yZWZJbmRleFsnbmFtZSddLnRleHRDb250ZW50ID0gaW5mby5uYW1lO1xuICAgICAgICB0aGlzLnJlZkluZGV4WydoZWlnaHQnXS50ZXh0Q29udGVudCA9IGluZm8uaGVpZ2h0O1xuICAgICAgICB0aGlzLnJlZkluZGV4Wyd3ZWlnaHQnXS50ZXh0Q29udGVudCA9IGluZm8ud2VpZ2h0O1xuICAgIH1cbn0pXG5cbnZhciB0ZXN0VmlldyA9IG5ldyBQbGF5ZXJWaWV3KHt9KTtcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXN0Vmlldy5lbClcblxudmFyIHRlc3RDb250cm9sbGVyID0gbmV3IFBsYXllckN0cmwoe1xuICAgIG1vZGVsOiB0ZXN0TW9kZWwsXG4gICAgdmlldzogdGVzdFZpZXdcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjtcbiIsInZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnY29udHJvbGxlcicpO1xudmFyIENvbnRyb2xsZXIgPSB7fTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLm1vZGVsID0gb3B0cy5tb2RlbCB8fCBudWxsO1xuICAgIHRoaXMudmlldyA9IG9wdHMudmlldyB8fCBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy52aWV3RXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy52aWV3RXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGhpcy52aWV3LmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy5tb2RlbEV2ZW50cykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMubW9kZWxFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLm1vZGVsLmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7IiwidmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBpZCA9IGlkO1xuICAgIHZhciBldmVudHMgPSB7fTtcbiAgICB0aGlzLnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgfTtcbiAgICB0aGlzLnB1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzKSB7XG4gICAgICAgIHRoaXMuX3B1Ymxpc2goZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMudW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICB0aGlzLl91bnN1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgfTtcbiAgICB0aGlzLnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5fdW5zdWJzY3JpYmVBbGwoZXZlbnQsIGlkLCBldmVudHMpO1xuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoIWV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XSA9IHt9O1xuICAgIH1cblxuICAgIGlmICghZXZlbnRzW2V2ZW50XVtpZF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XVtpZF0gPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGNhbGxiYWNrIGZ1bmN0aW9uIG11c3QgYmUgcGFzc2VkIGluIHRvIHN1YnNjcmliZScpO1xuICAgIH1cbiAgICBcbiAgICBldmVudHNbZXZlbnRdW2lkXS5wdXNoKGZ1bmMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKSB7XG4gICAgY3R4ID0gY3R4IHx8IG51bGw7XG4gICAgYXJncyA9IGFyZ3MgfHwgbnVsbDtcblxuICAgIHZhciBldmVudEJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgZm9yICh2YXIgYnVja2V0IGluIGV2ZW50QnVja2V0KSB7XG4gICAgICAgICAgICB2YXIgY2JRdWV1ZSA9IGV2ZW50QnVja2V0W2J1Y2tldF07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYlF1ZXVlKSkge1xuICAgICAgICAgICAgICAgIGNiUXVldWUuZm9yRWFjaChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgICAgICAgICBjYi5jYWxsKHRoaXMsIGN0eCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChidWNrZXQpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gYnVja2V0W2lkXTtcblxuICAgICAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGZuLCBpKSB7XG4gICAgICAgICAgICBpZihmbiA9PT0gZnVuYykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50LCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgfSBcblxuICAgIGZvciAodmFyIGV2dCBpbiBldmVudHMpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuc3Vic3JpYmVPbmUoZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICAgICAgaWYgKGJ1Y2tldCAmJiBidWNrZXRbaWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgYnVja2V0W2lkXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRCdXM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBjb3VudCA9IDE7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IHN0ciArIGNvdW50O1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxufTtcblxuIiwidmFyIE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXInKTtcbnZhciBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbnZhciBZYWYgPSB7XG4gICAgTW9kZWw6IE1vZGVsLFxuICAgIENvbnRyb2xsZXI6IENvbnRyb2xsZXIsXG4gICAgVmlldzogVmlld1xufVxuXG5cbmZvciAodmFyIGtleSBpbiBZYWYpIHtcbiAgICBZYWZba2V5XS5leHRlbmQgPSBleHRlbmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWWFmO1xuXG5mdW5jdGlvbiBleHRlbmQobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnbW9kZWwnKTtcbnZhciBNb2RlbCA9IHt9O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICB0aGlzLl9zZXQoa2V5LCB2YWwsIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXR0cmlidXRlcykpO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQob3B0cyk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplZCcsIHRoaXMsIG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwsIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICBmb3IgKHZhciBrIGluIGtleSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0KGssIGtleVtrXSwgYXR0cmlidXRlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYXR0cmlidXRlc1trZXldID0gdmFsO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZWQnLCB0aGlzLCB7a2V5OiB2YWx9KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2VkOicgKyBrZXksIHRoaXMsIHZhbCk7XG4gICAgfVxufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fZ2V0ID0gZnVuY3Rpb24oa2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzW2tleV07XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDsiLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cycpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCd2aWV3Jyk7XG52YXIgVmlldyA9IHt9O1xuXG5WaWV3Ll9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMucmVmSW5kZXggPSB7fTtcblxuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cbiAgICBpZih0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXJUbXBsID0gZnVuY3Rpb24odGFnLCB0ZW1wbGF0ZSkge1xuICAgIHZhciBlbDtcblxuICAgIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwgdGhpcy50ZW1wbGF0ZTtcblxuICAgIGlmICghdGFnKSB7XG4gICAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLnRhZ05hbWUpO1xuXG4gICAgICAgIGlmICh0aGlzLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdHlsZVsncm9vdCddKSB7XG4gICAgICAgICAgICBhZGRTdHlsZShlbCwgdGhpcy5zdHlsZVsncm9vdCddKTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWwgPSBjcmVhdGVPbmVFbGVtZW50KHRhZyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZSwgZWwpO1xuXG4gICAgcmV0dXJuIGVsO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudHModGVtcGxhdGUsIGJhc2UpIHtcbiAgICAgICAgZm9yICh2YXIgdGFnIGluIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZFRhZyh0YWcpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gY3JlYXRlT25lRWxlbWVudCh0YWcpO1xuICAgICAgICAgICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWwpXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3R5bGVbdGFnXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRTdHlsZShlbCwgdGhpcy5zdHlsZVt0YWddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZVt0YWddLCBlbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdyZWYnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZJbmRleFt0ZW1wbGF0ZVt0YWddXSA9IGJhc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdvbkNsaWNrJykge1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50cy5jYWxsKHRoaXMsIGJhc2UsICdjbGljaycgLHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSlcblxuICAgICAgICBpZiAocGFyc2VkWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHBhcnNlZFsyXTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZWRbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU3R5bGUoZWwsIHN0eWxlKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGVsLnN0eWxlW2F0dHJdID0gc3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFdmVudHMoZWwsIG9yaWdpbkV2dCwgbmV3RXZ0KSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIob3JpZ2luRXZ0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2gobmV3RXZ0LCB0aGlzLCBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgcmV0dXJuIHRhZyAhPT0gJ3N0eWxlJyAmJiB0YWcgIT09ICdyZWYnICYmIHRhZyAhPT0gJ29uQ2xpY2snO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsID0gbnVsbDtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG4gICAgdGhpcy5ldmVudEJ1cy51bnN1YnNjcmliZUFsbCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIl19
