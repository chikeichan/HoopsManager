(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"../helpers/IdGenerator":3}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
module.exports = function(str) {
    var count = 1;

    return function() {
        var id = str + count;
        count++;
        return id;
    }
};


},{}],4:[function(require,module,exports){
var Model = require('./model');
var Controller = require('./controller');
var View = require('./view');

var Trinity = {
    Model: Model,
    Controller: Controller,
    View: View
}


for (var key in Trinity) {
    Trinity[key].extend = extend;
}

module.exports = Trinity;

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
},{"./controller":1,"./model":5,"./view":6}],5:[function(require,module,exports){
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
    this.eventBus.publish('initialize', this, opts);
};

Model._constructor.prototype._set = function(key, val, attributes) {
    if (typeof key === 'object' && !Array.isArray(key)) {
        for (var k in key) {
            this._set(k, key[k], attributes);
        }
    }

    if (typeof key === 'string') {
        attributes[key] = val;
        var ret = {};
        ret[key] = val;
        this.eventBus.publish('change', this, ret);
        this.eventBus.publish('change:' + key, this, val);
    }
};

Model._constructor.prototype._get = function(key, attributes) {
    if (typeof key === 'string') {
        return attributes[key];
    }
};

module.exports = Model;

},{"../eventBus":2,"../helpers/IdGenerator":3}],6:[function(require,module,exports){
var EventBus = require('../eventBus');
var IdGenerator = require('../helpers/IdGenerator')('view');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    this.id = IdGenerator();
    this.refIndex = {};
    this.tagName = this.tagName || 'div';

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
        el = createOneElement.call(this, tag);
    }

    createElements.call(this, template, el);

    return el;

    function createElements(template, base) {
        for (var tag in template) {
            if (isValidTag(tag)) {
                var el = createOneElement.call(this, tag);
                base.appendChild(el);
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

        if (this.style[tag]) {
            addStyle(el, this.style[tag]);
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
        tag = tag.replace(/[.#]/, function(d) { return ',' + d + ','})
                 .split(',');
        return (tag[1] === '#' || tag[1] === '.') && tag.length === 3;
    }
};

View._constructor.prototype.addClass = function(el, className) {
    if (!this.hasClass(el,className)) {
        el.className += " " + className;
    }
};

View._constructor.prototype.removeClass = function(el, className) {
    if (this.hasClass(el,className)) {
        var reg = new RegExp('(\\s|^)'+className+'(\\s|$)');
        el.className = el.className.replace(reg,' ');
    }
};

View._constructor.prototype.hasClass = function(el, className) {
  return !!el.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'));
};

View._constructor.prototype.destroy = function() {
    this.el.remove();
    this.el = null;
    this.refIndex = {};
    this.eventBus.unsubscribeAll();
};

module.exports = View;

},{"../eventBus":2,"../helpers/IdGenerator":3}],7:[function(require,module,exports){
var Player = require('./models/player/basePlayer');

var HeaderView = require('./views/header');
var HeaderController = require('./controllers/header');

var header = new HeaderController({
    view: new HeaderView({})
});
},{"./controllers/header":8,"./models/player/basePlayer":9,"./views/header":10}],8:[function(require,module,exports){
var Trio = require('trio');

var HeaderCtrl = Trio.Controller.extend({
    initialize: function() {
        this.view.render();
        document.body.appendChild(this.view.el);
    }
});

module.exports = HeaderCtrl;
},{"trio":4}],9:[function(require,module,exports){
var Trio   = require('trio');
var Player = Trio.Model.extend({});

module.exports = Player;

},{"trio":4}],10:[function(require,module,exports){
var Trio = require('trio');

var HeaderView = Trio.View.extend({
    className: 'hoops-header',

    style: {
        root: {
            width: '100%',
            height: '50px',
            backgroundColor: '#333333',
            margin: '0',
            display: 'flex',
            'flex-flow': 'row nowrap',
            'align-items': 'center'
        },

        'div.info': {
            height: '36px',
            width: '36px',
            margin: '4px',
            background: 'url(http://sportsunbiased.com/wp-content/uploads/2014/12/lebron-james.png) no-repeat center',
            borderRadius: '50%'
        },

        'div.action-buttons': {
            display: 'flex',
            'flex-flow': 'row nowrap',
            flex: '1 1 auto',
            'justify-content': 'space-between'
        },

        'div.button': {
            height: '12px',
            width: '60px',
            padding: '8px 4px',
            margin: '0 4px',
            'font-family': 'Arial',
            'font-size': '12px',
            backgroundColor: 'rgb(0, 156, 180)',
            textAlign: 'center',
            borderRadius: '2px'
        },

        'span#text': {
            color: 'white'
        }
    },

    buttonOptions: ['calendar', 'news', 'roster', 'finance'],

    template: {
        'div.info' : {},
        'div.action-buttons': {
            ref: 'buttons',
            'div.button': {
                'span#text': {}
            }
        },
        'div.preferences': {}
    },

    render: function() {
        this.el = this.renderTmpl();
        this.renderButtons();
    },

    renderButtons: function() {
        if (!this.refIndex.buttons) {
            console.error('Need to render template first');
            return;
        }

        this.refIndex.buttons.innerHTML = '';

        this.buttonOptions.forEach( function(btn) {
            var buttonTmpl = this.template['div.action-buttons']['div.button'];
            var button = this.renderTmpl('div.button', buttonTmpl);
            this.addClass(button, btn);
            button.querySelector('#text').textContent = btn;
            this.refIndex.buttons.appendChild(button);
        }.bind(this));
    }
});

module.exports = HeaderView;
},{"trio":4}]},{},[7])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvaW5kZXguanMiLCIuLi9UcmluaXR5SlMvc3JjL2V2ZW50QnVzL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9oZWxwZXJzL0lkR2VuZXJhdG9yLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9pbmRleC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvbW9kZWwvaW5kZXguanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvaW5kZXguanMiLCJjbGllbnQvc3JjL2FwcC5qcyIsImNsaWVudC9zcmMvY29udHJvbGxlcnMvaGVhZGVyL2luZGV4LmpzIiwiY2xpZW50L3NyYy9tb2RlbHMvcGxheWVyL2Jhc2VQbGF5ZXIuanMiLCJjbGllbnQvc3JjL3ZpZXdzL2hlYWRlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdjb250cm9sbGVyJyk7XG52YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLnZpZXdFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLnZpZXdFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLnZpZXcuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLm1vZGVsRXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5tb2RlbEV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMubW9kZWwuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlcjsiLCJ2YXIgRXZlbnRCdXMgPSBmdW5jdGlvbigpIHtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGlkID0gaWQ7XG4gICAgdmFyIGV2ZW50cyA9IHt9O1xuICAgIHRoaXMuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMucHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MpIHtcbiAgICAgICAgdGhpcy5fcHVibGlzaChldmVudCwgY3R4LCBhcmdzLCBldmVudHMpO1xuICAgIH07XG4gICAgdGhpcy51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgIHRoaXMuX3Vuc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLl91bnN1YnNjcmliZUFsbChldmVudCwgaWQsIGV2ZW50cyk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIGlmICghZXZlbnRzW2V2ZW50XSkge1xuICAgICAgICBldmVudHNbZXZlbnRdID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFldmVudHNbZXZlbnRdW2lkXSkge1xuICAgICAgICBldmVudHNbZXZlbnRdW2lkXSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIGV2ZW50c1tldmVudF1baWRdLnB1c2goZnVuYyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3B1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzLCBldmVudHMpIHtcbiAgICBjdHggPSBjdHggfHwgbnVsbDtcbiAgICBhcmdzID0gYXJncyB8fCBudWxsO1xuXG4gICAgdmFyIGV2ZW50QnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChldmVudEJ1Y2tldCkge1xuICAgICAgICBmb3IgKHZhciBidWNrZXQgaW4gZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgICAgIHZhciBjYlF1ZXVlID0gZXZlbnRCdWNrZXRbYnVja2V0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNiUXVldWUpKSB7XG4gICAgICAgICAgICAgICAgY2JRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGJ1Y2tldCkge1xuICAgICAgICB2YXIgcXVldWUgPSBidWNrZXRbaWRdO1xuXG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZm4sIGkpIHtcbiAgICAgICAgICAgIGlmKGZuID09PSBmdW5jKSB7XG4gICAgICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IFxuXG4gICAgZm9yICh2YXIgZXZ0IGluIGV2ZW50cykge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5zdWJzcmliZU9uZShldmVudCkge1xuICAgICAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgICAgICBpZiAoYnVja2V0ICYmIGJ1Y2tldFtpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBidWNrZXRbaWRdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1cztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIGNvdW50ID0gMTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkID0gc3RyICsgY291bnQ7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG59O1xuXG4iLCJ2YXIgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlcicpO1xudmFyIFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxudmFyIFRyaW5pdHkgPSB7XG4gICAgTW9kZWw6IE1vZGVsLFxuICAgIENvbnRyb2xsZXI6IENvbnRyb2xsZXIsXG4gICAgVmlldzogVmlld1xufVxuXG5cbmZvciAodmFyIGtleSBpbiBUcmluaXR5KSB7XG4gICAgVHJpbml0eVtrZXldLmV4dGVuZCA9IGV4dGVuZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmluaXR5O1xuXG5mdW5jdGlvbiBleHRlbmQobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnbW9kZWwnKTtcbnZhciBNb2RlbCA9IHt9O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICB0aGlzLl9zZXQoa2V5LCB2YWwsIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXR0cmlidXRlcykpO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQob3B0cyk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplJywgdGhpcywgb3B0cyk7XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9zZXQgPSBmdW5jdGlvbihrZXksIHZhbCwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLl9zZXQoaywga2V5W2tdLCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWw7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlJywgdGhpcywgcmV0KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2U6JyArIGtleSwgdGhpcywgdmFsKTtcbiAgICB9XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9nZXQgPSBmdW5jdGlvbihrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXNba2V5XTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xuIiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgndmlldycpO1xudmFyIFZpZXcgPSB7fTtcblxuVmlldy5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG4gICAgdGhpcy50YWdOYW1lID0gdGhpcy50YWdOYW1lIHx8ICdkaXYnO1xuXG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLnJlbmRlclRtcGwgPSBmdW5jdGlvbih0YWcsIHRlbXBsYXRlKSB7XG4gICAgdmFyIGVsO1xuXG4gICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZSB8fCB0aGlzLnRlbXBsYXRlO1xuXG4gICAgaWYgKCF0YWcpIHtcbiAgICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0eWxlWydyb290J10pIHtcbiAgICAgICAgICAgIGFkZFN0eWxlKGVsLCB0aGlzLnN0eWxlWydyb290J10pO1xuICAgICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICBlbCA9IGNyZWF0ZU9uZUVsZW1lbnQuY2FsbCh0aGlzLCB0YWcpO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnRzLmNhbGwodGhpcywgdGVtcGxhdGUsIGVsKTtcblxuICAgIHJldHVybiBlbDtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRzKHRlbXBsYXRlLCBiYXNlKSB7XG4gICAgICAgIGZvciAodmFyIHRhZyBpbiB0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgaWYgKGlzVmFsaWRUYWcodGFnKSkge1xuICAgICAgICAgICAgICAgIHZhciBlbCA9IGNyZWF0ZU9uZUVsZW1lbnQuY2FsbCh0aGlzLCB0YWcpO1xuICAgICAgICAgICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgIGNyZWF0ZUVsZW1lbnRzLmNhbGwodGhpcywgdGVtcGxhdGVbdGFnXSwgZWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnID09PSAncmVmJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmSW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnID09PSAnb25DbGljaycpIHtcbiAgICAgICAgICAgICAgICBhZGRFdmVudHMuY2FsbCh0aGlzLCBiYXNlLCAnY2xpY2snICx0ZW1wbGF0ZVt0YWddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZU9uZUVsZW1lbnQodGFnKSB7XG4gICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZVRhZyh0YWcpO1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHBhcnNlZFswXTtcblxuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpXG5cbiAgICAgICAgaWYgKHBhcnNlZFsxXSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBwYXJzZWRbMl07XG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VkWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGVsLmlkID0gcGFyc2VkWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3R5bGVbdGFnXSkge1xuICAgICAgICAgICAgYWRkU3R5bGUoZWwsIHRoaXMuc3R5bGVbdGFnXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU3R5bGUoZWwsIHN0eWxlKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGVsLnN0eWxlW2F0dHJdID0gc3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFdmVudHMoZWwsIG9yaWdpbkV2dCwgbmV3RXZ0KSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIob3JpZ2luRXZ0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2gobmV3RXZ0LCB0aGlzLCBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiAodGFnWzFdID09PSAnIycgfHwgdGFnWzFdID09PSAnLicpICYmIHRhZy5sZW5ndGggPT09IDM7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICAgIGlmICghdGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIGVsLmNsYXNzTmFtZSArPSBcIiBcIiArIGNsYXNzTmFtZTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKHRoaXMuaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICB2YXIgcmVnID0gbmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbGFzc05hbWUrJyhcXFxcc3wkKScpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZWcsJyAnKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuaGFzQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gIHJldHVybiAhIWVsLmNsYXNzTmFtZS5tYXRjaChuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJykpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmVsLnJlbW92ZSgpO1xuICAgIHRoaXMuZWwgPSBudWxsO1xuICAgIHRoaXMucmVmSW5kZXggPSB7fTtcbiAgICB0aGlzLmV2ZW50QnVzLnVuc3Vic2NyaWJlQWxsKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7XG4iLCJ2YXIgUGxheWVyID0gcmVxdWlyZSgnLi9tb2RlbHMvcGxheWVyL2Jhc2VQbGF5ZXInKTtcblxudmFyIEhlYWRlclZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL2hlYWRlcicpO1xudmFyIEhlYWRlckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL2hlYWRlcicpO1xuXG52YXIgaGVhZGVyID0gbmV3IEhlYWRlckNvbnRyb2xsZXIoe1xuICAgIHZpZXc6IG5ldyBIZWFkZXJWaWV3KHt9KVxufSk7IiwidmFyIFRyaW8gPSByZXF1aXJlKCd0cmlvJyk7XG5cbnZhciBIZWFkZXJDdHJsID0gVHJpby5Db250cm9sbGVyLmV4dGVuZCh7XG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudmlldy5yZW5kZXIoKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnZpZXcuZWwpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlckN0cmw7IiwidmFyIFRyaW8gICA9IHJlcXVpcmUoJ3RyaW8nKTtcbnZhciBQbGF5ZXIgPSBUcmlvLk1vZGVsLmV4dGVuZCh7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuIiwidmFyIFRyaW8gPSByZXF1aXJlKCd0cmlvJyk7XG5cbnZhciBIZWFkZXJWaWV3ID0gVHJpby5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lOiAnaG9vcHMtaGVhZGVyJyxcblxuICAgIHN0eWxlOiB7XG4gICAgICAgIHJvb3Q6IHtcbiAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICBoZWlnaHQ6ICc1MHB4JyxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMzMzMzMzMnLFxuICAgICAgICAgICAgbWFyZ2luOiAnMCcsXG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAnZmxleC1mbG93JzogJ3JvdyBub3dyYXAnLFxuICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcidcbiAgICAgICAgfSxcblxuICAgICAgICAnZGl2LmluZm8nOiB7XG4gICAgICAgICAgICBoZWlnaHQ6ICczNnB4JyxcbiAgICAgICAgICAgIHdpZHRoOiAnMzZweCcsXG4gICAgICAgICAgICBtYXJnaW46ICc0cHgnLFxuICAgICAgICAgICAgYmFja2dyb3VuZDogJ3VybChodHRwOi8vc3BvcnRzdW5iaWFzZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE0LzEyL2xlYnJvbi1qYW1lcy5wbmcpIG5vLXJlcGVhdCBjZW50ZXInLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdkaXYuYWN0aW9uLWJ1dHRvbnMnOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAnZmxleC1mbG93JzogJ3JvdyBub3dyYXAnLFxuICAgICAgICAgICAgZmxleDogJzEgMSBhdXRvJyxcbiAgICAgICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnc3BhY2UtYmV0d2VlbidcbiAgICAgICAgfSxcblxuICAgICAgICAnZGl2LmJ1dHRvbic6IHtcbiAgICAgICAgICAgIGhlaWdodDogJzEycHgnLFxuICAgICAgICAgICAgd2lkdGg6ICc2MHB4JyxcbiAgICAgICAgICAgIHBhZGRpbmc6ICc4cHggNHB4JyxcbiAgICAgICAgICAgIG1hcmdpbjogJzAgNHB4JyxcbiAgICAgICAgICAgICdmb250LWZhbWlseSc6ICdBcmlhbCcsXG4gICAgICAgICAgICAnZm9udC1zaXplJzogJzEycHgnLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiKDAsIDE1NiwgMTgwKScsXG4gICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMnB4J1xuICAgICAgICB9LFxuXG4gICAgICAgICdzcGFuI3RleHQnOiB7XG4gICAgICAgICAgICBjb2xvcjogJ3doaXRlJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGJ1dHRvbk9wdGlvbnM6IFsnY2FsZW5kYXInLCAnbmV3cycsICdyb3N0ZXInLCAnZmluYW5jZSddLFxuXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgJ2Rpdi5pbmZvJyA6IHt9LFxuICAgICAgICAnZGl2LmFjdGlvbi1idXR0b25zJzoge1xuICAgICAgICAgICAgcmVmOiAnYnV0dG9ucycsXG4gICAgICAgICAgICAnZGl2LmJ1dHRvbic6IHtcbiAgICAgICAgICAgICAgICAnc3BhbiN0ZXh0Jzoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpdi5wcmVmZXJlbmNlcyc6IHt9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWwgPSB0aGlzLnJlbmRlclRtcGwoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJCdXR0b25zKCk7XG4gICAgfSxcblxuICAgIHJlbmRlckJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMucmVmSW5kZXguYnV0dG9ucykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTmVlZCB0byByZW5kZXIgdGVtcGxhdGUgZmlyc3QnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVmSW5kZXguYnV0dG9ucy5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICB0aGlzLmJ1dHRvbk9wdGlvbnMuZm9yRWFjaCggZnVuY3Rpb24oYnRuKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9uVG1wbCA9IHRoaXMudGVtcGxhdGVbJ2Rpdi5hY3Rpb24tYnV0dG9ucyddWydkaXYuYnV0dG9uJ107XG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gdGhpcy5yZW5kZXJUbXBsKCdkaXYuYnV0dG9uJywgYnV0dG9uVG1wbCk7XG4gICAgICAgICAgICB0aGlzLmFkZENsYXNzKGJ1dHRvbiwgYnRuKTtcbiAgICAgICAgICAgIGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCcjdGV4dCcpLnRleHRDb250ZW50ID0gYnRuO1xuICAgICAgICAgICAgdGhpcy5yZWZJbmRleC5idXR0b25zLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSGVhZGVyVmlldzsiXX0=
