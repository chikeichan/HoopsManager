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
var Model = require('./model/model');
var Controller = require('./controller/controller');
var View = require('./view/view');
var Stylizer = require('./stylizer/stylizer');
var EventBus = require('./eventBus/eventBus');
var Vow = require('./vow/vow');

var gEventBus;
var moduleStore = {};

var Trio = {
    Model: Model,
    Controller: Controller,
    View: View,
    Stylizer: Stylizer,
    Vow: Vow
}

for (var key in Trio) {
    Trio[key].extend = extend;
}

Trio.start = function(cb) {
    gEventBus = new EventBus();
    cb.apply(this, arguments);
};

Trio.getGlobalEventBus = function() {
    if (!gEventBus) {
        throw new Error('Need to start applicaiton first.');
    }
    return gEventBus;
};

Trio.export = function(key, func) {
    if (typeof key !== 'string') {
        throw new Error('Module name is not a string.');
    }

    if (typeof func !== 'function') {
        throw new Error('Module is not a function.');
    }
    moduleStore[key] = func;
};

Trio.import = function(key, url) {
    if (typeof key !== 'string') {
        throw new Error('Module name is not a string.');
    }

    if (typeof url !== 'string') {
        throw new Error('URL is not a string.');
    }

    var module = moduleStore[key];

    if (!module) {
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.src = url;
        document.head.appendChild(script);
    }

    return moduleStore[key].apply(this, arguments);
};


module.exports = Trio;

function extend(methods) {
    var parent = this._constructor;

    if (!parent) {
        return;
    }

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
},{"./controller/controller":1,"./eventBus/eventBus":2,"./model/model":5,"./stylizer/stylizer":6,"./view/view":7,"./vow/vow":8}],5:[function(require,module,exports){
var EventBus = require('../eventBus/eventBus');
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

},{"../eventBus/eventBus":2,"../helpers/IdGenerator":3}],6:[function(require,module,exports){
var Stylizer = {};
var mixins = {};
var variables = {};

Stylizer.stringify = function(style) {
    var ret = '';

    for (var selector in style) {
        ret += selector + '{';
        var properties = style[selector];
        for (var prop in properties) {
            var setting = properties[prop];
            ret += prop + ':' + setting + ';';
        }
        ret = ret.slice(0, ret.length - 1);
        ret += '}';
    }

    return ret;
};

Stylizer.registerMixins = function(key, func) {
    mixins[key] = func;
};

Stylizer.registerVariables = function(key, val) {
    variables[key] = val;
};

Stylizer.getVariable = function(key) {
    return variables[key];
};

Stylizer.Mixins = function(key, opts) {
    if (!mixins[key]) {
        console.error('Mixin for ' + key + ' does not exist');
        return;
    }
    return mixins[key].call(this, opts);
};

module.exports = Stylizer;
},{}],7:[function(require,module,exports){
var EventBus = require('../eventBus/eventBus');
var Stylizer = require('../stylizer/stylizer');
var IdGenerator = require('../helpers/IdGenerator')('view');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    var template = this.template;
    var style = this.style;

    this.id = IdGenerator();
    this.refIndex = {};

    this.eventBus = opts.eventBus || new EventBus();
    this.eventBus.register(this.id);

    if (style) {
        this.style = Stylizer.stringify(style);
    }

    if (template) {
        this.template = this.renderTemplate(template);
    }

    if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.renderTemplate = function(template) {
    var el, style;

    el = document.createDocumentFragment();

    style = document.createElement('style');
    style.innerText = this.style;
    el.appendChild(style);

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

        var el = document.createElement(tagName);

        if (parsed[1] === '.') {
            el.className = parsed[2];
        } else if (parsed[1] === '#') {
            el.id = parsed[2];
        }

        return el;
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

View._constructor.prototype.appendComponentTo = function(parent) {
    var Root, root, clone;
    var proto = Object.create(HTMLElement.prototype);
    
    Root = document.registerElement(this.tagName, {
        prototype: proto
    });

    root = new Root()

    parent.appendChild(root);
    this.root = root.createShadowRoot();
    this.root.appendChild(this.template);
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

},{"../eventBus/eventBus":2,"../helpers/IdGenerator":3,"../stylizer/stylizer":6}],8:[function(require,module,exports){
window.LinkedList = function() {
    this.head = null;
    this.tail = null;
};

LinkedList.prototype.addToTail = function(fn) {
    var tick = {
        func: fn,
        next: null
    }

    if (!this.head) {
        this.head = tick;
        this.head.next = this.tail;
    }

    if (this.tail) {
        this.tail.next = tick;
    }

    this.tail = tick;
};

LinkedList.prototype.removeHead = function() {
    var previousHead = this.head.func;

    this.head = this.head.next;
    if (this.head === null) {
        this.tail = null;
        return null;
    }

    return previousHead;
};

var PENDING  = {},
    RESOLVED = {},
    REJECTED = {}; 

var Vow = function() {
    this.status = PENDING;
    this.queue = new LinkedList();
};

Vow.prototype.resolve = function(ret) {
    this.status = RESOLVED;

    while (this.queue.head) {
        var fn = this.queue.removeHead();
        var val = fn.call(this, ret);
        ret = val;
    }
};

Vow.prototype.then = function(func) {
    this.queue.addToTail(func);
};



module.exports = Vow;


},{}],9:[function(require,module,exports){
window.Trio = require('trio');
},{"trio":4}]},{},[9])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2RlbC9tb2RlbC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdm93L3Zvdy5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdjb250cm9sbGVyJyk7XG52YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLnZpZXdFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLnZpZXdFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLnZpZXcuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLm1vZGVsRXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5tb2RlbEV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMubW9kZWwuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlcjsiLCJ2YXIgRXZlbnRCdXMgPSBmdW5jdGlvbigpIHtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGlkID0gaWQ7XG4gICAgdmFyIGV2ZW50cyA9IHt9O1xuICAgIHRoaXMuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMucHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MpIHtcbiAgICAgICAgdGhpcy5fcHVibGlzaChldmVudCwgY3R4LCBhcmdzLCBldmVudHMpO1xuICAgIH07XG4gICAgdGhpcy51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgIHRoaXMuX3Vuc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLl91bnN1YnNjcmliZUFsbChldmVudCwgaWQsIGV2ZW50cyk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIGlmICghZXZlbnRzW2V2ZW50XSkge1xuICAgICAgICBldmVudHNbZXZlbnRdID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFldmVudHNbZXZlbnRdW2lkXSkge1xuICAgICAgICBldmVudHNbZXZlbnRdW2lkXSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIGV2ZW50c1tldmVudF1baWRdLnB1c2goZnVuYyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3B1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzLCBldmVudHMpIHtcbiAgICBjdHggPSBjdHggfHwgbnVsbDtcbiAgICBhcmdzID0gYXJncyB8fCBudWxsO1xuXG4gICAgdmFyIGV2ZW50QnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChldmVudEJ1Y2tldCkge1xuICAgICAgICBmb3IgKHZhciBidWNrZXQgaW4gZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgICAgIHZhciBjYlF1ZXVlID0gZXZlbnRCdWNrZXRbYnVja2V0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNiUXVldWUpKSB7XG4gICAgICAgICAgICAgICAgY2JRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGJ1Y2tldCkge1xuICAgICAgICB2YXIgcXVldWUgPSBidWNrZXRbaWRdO1xuXG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZm4sIGkpIHtcbiAgICAgICAgICAgIGlmKGZuID09PSBmdW5jKSB7XG4gICAgICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IFxuXG4gICAgZm9yICh2YXIgZXZ0IGluIGV2ZW50cykge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5zdWJzcmliZU9uZShldmVudCkge1xuICAgICAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgICAgICBpZiAoYnVja2V0ICYmIGJ1Y2tldFtpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBidWNrZXRbaWRdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1cztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIGNvdW50ID0gMTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkID0gc3RyICsgY291bnQ7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG59O1xuXG4iLCJ2YXIgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsL21vZGVsJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci9jb250cm9sbGVyJyk7XG52YXIgVmlldyA9IHJlcXVpcmUoJy4vdmlldy92aWV3Jyk7XG52YXIgU3R5bGl6ZXIgPSByZXF1aXJlKCcuL3N0eWxpemVyL3N0eWxpemVyJyk7XG52YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgVm93ID0gcmVxdWlyZSgnLi92b3cvdm93Jyk7XG5cbnZhciBnRXZlbnRCdXM7XG52YXIgbW9kdWxlU3RvcmUgPSB7fTtcblxudmFyIFRyaW8gPSB7XG4gICAgTW9kZWw6IE1vZGVsLFxuICAgIENvbnRyb2xsZXI6IENvbnRyb2xsZXIsXG4gICAgVmlldzogVmlldyxcbiAgICBTdHlsaXplcjogU3R5bGl6ZXIsXG4gICAgVm93OiBWb3dcbn1cblxuZm9yICh2YXIga2V5IGluIFRyaW8pIHtcbiAgICBUcmlvW2tleV0uZXh0ZW5kID0gZXh0ZW5kO1xufVxuXG5UcmlvLnN0YXJ0ID0gZnVuY3Rpb24oY2IpIHtcbiAgICBnRXZlbnRCdXMgPSBuZXcgRXZlbnRCdXMoKTtcbiAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuVHJpby5nZXRHbG9iYWxFdmVudEJ1cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghZ0V2ZW50QnVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTmVlZCB0byBzdGFydCBhcHBsaWNhaXRvbiBmaXJzdC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGdFdmVudEJ1cztcbn07XG5cblRyaW8uZXhwb3J0ID0gZnVuY3Rpb24oa2V5LCBmdW5jKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIG5hbWUgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBpcyBub3QgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG4gICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmM7XG59O1xuXG5UcmlvLmltcG9ydCA9IGZ1bmN0aW9uKGtleSwgdXJsKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIG5hbWUgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VSTCBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgdmFyIG1vZHVsZSA9IG1vZHVsZVN0b3JlW2tleV07XG5cbiAgICBpZiAoIW1vZHVsZSkge1xuICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICAgICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgIH1cblxuICAgIHJldHVybiBtb2R1bGVTdG9yZVtrZXldLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVHJpbztcblxuZnVuY3Rpb24gZXh0ZW5kKG1ldGhvZHMpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fY29uc3RydWN0b3I7XG5cbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHN0YXRpY0F0dHIgPSB7fTtcbiAgICB2YXIgY2hpbGQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHN0YXRpY0F0dHIpIHtcbiAgICAgICAgICAgIHRoaXNba2V5XSA9IHN0YXRpY0F0dHJba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIFxuICAgIHZhciBleHRlbmRlZCA9IHt9O1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBwYXJlbnQucHJvdG90eXBlKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocGFyZW50LnByb3RvdHlwZSwgcHJvcCkpIHtcbiAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gcGFyZW50LnByb3RvdHlwZVtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIHByb3AgaW4gbWV0aG9kcykge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1ldGhvZHMsIHByb3ApKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0aWNBdHRyW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZXh0ZW5kZWQpO1xuXG4gICAgcmV0dXJuIGNoaWxkO1xufSIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ21vZGVsJyk7XG52YXIgTW9kZWwgPSB7fTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciBhdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICAgICAgdGhpcy5fc2V0KGtleSwgdmFsLCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KGtleSwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF0dHJpYnV0ZXMpKTtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0KG9wdHMpO1xuICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnaW5pdGlhbGl6ZScsIHRoaXMsIG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwsIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICBmb3IgKHZhciBrIGluIGtleSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0KGssIGtleVtrXSwgYXR0cmlidXRlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYXR0cmlidXRlc1trZXldID0gdmFsO1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHJldFtrZXldID0gdmFsO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZScsIHRoaXMsIHJldCk7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlOicgKyBrZXksIHRoaXMsIHZhbCk7XG4gICAgfVxufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fZ2V0ID0gZnVuY3Rpb24oa2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzW2tleV07XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcbiIsInZhciBTdHlsaXplciA9IHt9O1xudmFyIG1peGlucyA9IHt9O1xudmFyIHZhcmlhYmxlcyA9IHt9O1xuXG5TdHlsaXplci5zdHJpbmdpZnkgPSBmdW5jdGlvbihzdHlsZSkge1xuICAgIHZhciByZXQgPSAnJztcblxuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIHN0eWxlKSB7XG4gICAgICAgIHJldCArPSBzZWxlY3RvciArICd7JztcbiAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBzdHlsZVtzZWxlY3Rvcl07XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgcmV0ICs9IHByb3AgKyAnOicgKyBzZXR0aW5nICsgJzsnO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IHJldC5zbGljZSgwLCByZXQubGVuZ3RoIC0gMSk7XG4gICAgICAgIHJldCArPSAnfSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cblN0eWxpemVyLnJlZ2lzdGVyTWl4aW5zID0gZnVuY3Rpb24oa2V5LCBmdW5jKSB7XG4gICAgbWl4aW5zW2tleV0gPSBmdW5jO1xufTtcblxuU3R5bGl6ZXIucmVnaXN0ZXJWYXJpYWJsZXMgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgIHZhcmlhYmxlc1trZXldID0gdmFsO1xufTtcblxuU3R5bGl6ZXIuZ2V0VmFyaWFibGUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gdmFyaWFibGVzW2tleV07XG59O1xuXG5TdHlsaXplci5NaXhpbnMgPSBmdW5jdGlvbihrZXksIG9wdHMpIHtcbiAgICBpZiAoIW1peGluc1trZXldKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01peGluIGZvciAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBtaXhpbnNba2V5XS5jYWxsKHRoaXMsIG9wdHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHlsaXplcjsiLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIFN0eWxpemVyID0gcmVxdWlyZSgnLi4vc3R5bGl6ZXIvc3R5bGl6ZXInKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgndmlldycpO1xudmFyIFZpZXcgPSB7fTtcblxuVmlldy5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlO1xuICAgIHZhciBzdHlsZSA9IHRoaXMuc3R5bGU7XG5cbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG5cbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICAgIHRoaXMuc3R5bGUgPSBTdHlsaXplci5zdHJpbmdpZnkoc3R5bGUpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLnJlbmRlclRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICB2YXIgZWwsIHN0eWxlO1xuXG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGUuaW5uZXJUZXh0ID0gdGhpcy5zdHlsZTtcbiAgICBlbC5hcHBlbmRDaGlsZChzdHlsZSk7XG5cbiAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlLCBlbCk7XG5cbiAgICByZXR1cm4gZWw7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50cyh0ZW1wbGF0ZSwgYmFzZSkge1xuICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChpc1ZhbGlkVGFnKHRhZykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBjcmVhdGVPbmVFbGVtZW50LmNhbGwodGhpcywgdGFnKTtcbiAgICAgICAgICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlW3RhZ10sIGVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRhZyA9PT0gJ3JlZicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZkluZGV4W3RlbXBsYXRlW3RhZ11dID0gYmFzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRhZyA9PT0gJ29uQ2xpY2snKSB7XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRzLmNhbGwodGhpcywgYmFzZSwgJ2NsaWNrJyAsdGVtcGxhdGVbdGFnXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVPbmVFbGVtZW50KHRhZykge1xuICAgICAgICB2YXIgcGFyc2VkID0gcGFyc2VUYWcodGFnKTtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSBwYXJzZWRbMF07XG5cbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcblxuICAgICAgICBpZiAocGFyc2VkWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHBhcnNlZFsyXTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZWRbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkRXZlbnRzKGVsLCBvcmlnaW5FdnQsIG5ld0V2dCkge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKG9yaWdpbkV2dCwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKG5ld0V2dCwgdGhpcywgZSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gdGFnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVmFsaWRUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gKHRhZ1sxXSA9PT0gJyMnIHx8IHRhZ1sxXSA9PT0gJy4nKSAmJiB0YWcubGVuZ3RoID09PSAzO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5hcHBlbmRDb21wb25lbnRUbyA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgIHZhciBSb290LCByb290LCBjbG9uZTtcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgXG4gICAgUm9vdCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCh0aGlzLnRhZ05hbWUsIHtcbiAgICAgICAgcHJvdG90eXBlOiBwcm90b1xuICAgIH0pO1xuXG4gICAgcm9vdCA9IG5ldyBSb290KClcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChyb290KTtcbiAgICB0aGlzLnJvb3QgPSByb290LmNyZWF0ZVNoYWRvd1Jvb3QoKTtcbiAgICB0aGlzLnJvb3QuYXBwZW5kQ2hpbGQodGhpcy50ZW1wbGF0ZSk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKCF0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgZWwuY2xhc3NOYW1lICs9IFwiIFwiICsgY2xhc3NOYW1lO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAodGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlZywnICcpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgcmV0dXJuICEhZWwuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKSk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWwucmVtb3ZlKCk7XG4gICAgdGhpcy5lbCA9IG51bGw7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMudW5zdWJzY3JpYmVBbGwoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiIsIndpbmRvdy5MaW5rZWRMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB0aGlzLnRhaWwgPSBudWxsO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkVG9UYWlsID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgdGljayA9IHtcbiAgICAgICAgZnVuYzogZm4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhZCkge1xuICAgICAgICB0aGlzLmhlYWQgPSB0aWNrO1xuICAgICAgICB0aGlzLmhlYWQubmV4dCA9IHRoaXMudGFpbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YWlsKSB7XG4gICAgICAgIHRoaXMudGFpbC5uZXh0ID0gdGljaztcbiAgICB9XG5cbiAgICB0aGlzLnRhaWwgPSB0aWNrO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUucmVtb3ZlSGVhZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcmV2aW91c0hlYWQgPSB0aGlzLmhlYWQuZnVuYztcblxuICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuICAgIGlmICh0aGlzLmhlYWQgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy50YWlsID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzSGVhZDtcbn07XG5cbnZhciBQRU5ESU5HICA9IHt9LFxuICAgIFJFU09MVkVEID0ge30sXG4gICAgUkVKRUNURUQgPSB7fTsgXG5cbnZhciBWb3cgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXR1cyA9IFBFTkRJTkc7XG4gICAgdGhpcy5xdWV1ZSA9IG5ldyBMaW5rZWRMaXN0KCk7XG59O1xuXG5Wb3cucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICB0aGlzLnN0YXR1cyA9IFJFU09MVkVEO1xuXG4gICAgd2hpbGUgKHRoaXMucXVldWUuaGVhZCkge1xuICAgICAgICB2YXIgZm4gPSB0aGlzLnF1ZXVlLnJlbW92ZUhlYWQoKTtcbiAgICAgICAgdmFyIHZhbCA9IGZuLmNhbGwodGhpcywgcmV0KTtcbiAgICAgICAgcmV0ID0gdmFsO1xuICAgIH1cbn07XG5cblZvdy5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB0aGlzLnF1ZXVlLmFkZFRvVGFpbChmdW5jKTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFZvdztcblxuIiwid2luZG93LlRyaW8gPSByZXF1aXJlKCd0cmlvJyk7Il19
