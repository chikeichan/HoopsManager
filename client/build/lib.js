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
window.moduleStore = {};

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

Trio.import = function(modules) {
    var loaded = 0;
    var count  = Object.keys(modules);
    var vow = Trio.Vow();
    var ret = {};
    var url;

    _import(count.pop());
    return vow.promise;

    function _import(key) {
        var url = modules[key];

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
            script.onload = function() {
                var defer = Trio.Vow();

                defer.promise.then(function(data) {
                    ret[key] = data;
                    loaded++;
                    if (count.length === 0) {
                        vow.resolve(ret);
                    } else {
                        _import(count.pop());
                    }
                });
                script.remove()
                moduleStore[key].call(this, defer.resolve);
            }.bind(this, key);
            document.body.appendChild(script);
        }
    }
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
var LinkedList = function() {
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
    var previousHead;

    if (this.head) {
        previousHead = this.head.func;
    }

    if (this.head.next) {
        this.head = this.head.next;
    } else {
        this.tail = null;
        this.head = null;
    }

    return previousHead;
};

var PENDING  = {},
    RESOLVED = {},
    REJECTED = {}; 

var Vow = function() {
    var vow = {};

    var status       = PENDING;
    var resolveTicks = new LinkedList();
    var rejectTicks  = new LinkedList();
    var doneTick, exception, val, fn;

    vow.resolve = function(ret) {
        if (status === REJECTED || !resolveTicks.head) {
            handleDone();
            return;
        }

        status = RESOLVED;
        val = ret;

        fn = resolveTicks.removeHead();

        try {
            val = fn.call(this, ret);
        }

        catch (e) {
            status = REJECTED;
            exception = e;
            vow.reject(e);
            return;
        }

        vow.resolve(val);
    };

    vow.reject = function(e) {
        if (status === RESOLVED || !rejectTicks.head) {
            handleDone();
            return;
        }

        status = REJECTED;
        exception = e;

        fn = rejectTicks.removeHead();

        try {
            fn.call(this, exception);
        }

        catch (e) {
            exception = e;
            vow.reject(exception);
            return;
        }

        vow.reject(exception);
    };


    vow.promise = (function() {
        var promise = {}

        promise.then = function(func) {
            resolveTicks.addToTail(func);
            return promise;
        };

        promise.catch = function(func) {
            rejectTicks.addToTail(func);
            return promise;
        };

        promise.done = function(func) {
            doneTick = func;
        };

        return promise;

    })();

    return vow;
    
    function handleDone() {
        if (exception) {
            console.error(exception);
        }
        if (doneTick) {
            doneTick.call(this, val);
        }
    };
};

module.exports = Vow;


},{}],9:[function(require,module,exports){
window.Trio = require('trio');
},{"trio":4}]},{},[9])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2RlbC9tb2RlbC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdm93L3Zvdy5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2NvbnRyb2xsZXInKTtcbnZhciBDb250cm9sbGVyID0ge307XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5tb2RlbCA9IG9wdHMubW9kZWwgfHwgbnVsbDtcbiAgICB0aGlzLnZpZXcgPSBvcHRzLnZpZXcgfHwgbnVsbDtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuX2FkZEV2ZW50TGlzdGVuZXJzKCk7XG59O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2FkZEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgZXZ0IGluIHRoaXMudmlld0V2ZW50cykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMudmlld0V2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMudmlldy5ldmVudEJ1cy5zdWJzY3JpYmUoZXZ0LCBmbik7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZXZ0IGluIHRoaXMubW9kZWxFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLm1vZGVsRXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGhpcy5tb2RlbC5ldmVudEJ1cy5zdWJzY3JpYmUoZXZ0LCBmbik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyOyIsInZhciBFdmVudEJ1cyA9IGZ1bmN0aW9uKCkge1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgaWQgPSBpZDtcbiAgICB2YXIgZXZlbnRzID0ge307XG4gICAgdGhpcy5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgIH07XG4gICAgdGhpcy5wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncykge1xuICAgICAgICB0aGlzLl9wdWJsaXNoKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cyk7XG4gICAgfTtcbiAgICB0aGlzLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fdW5zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgIH07XG4gICAgdGhpcy51bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuX3Vuc3Vic2NyaWJlQWxsKGV2ZW50LCBpZCwgZXZlbnRzKTtcbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3N1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKCFldmVudHNbZXZlbnRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF0gPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50c1tldmVudF1baWRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF1baWRdID0gW107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHBhc3NlZCBpbiB0byBzdWJzY3JpYmUnKTtcbiAgICB9XG4gICAgXG4gICAgZXZlbnRzW2V2ZW50XVtpZF0ucHVzaChmdW5jKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fcHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cykge1xuICAgIGN0eCA9IGN0eCB8fCBudWxsO1xuICAgIGFyZ3MgPSBhcmdzIHx8IG51bGw7XG5cbiAgICB2YXIgZXZlbnRCdWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGV2ZW50QnVja2V0KSB7XG4gICAgICAgIGZvciAodmFyIGJ1Y2tldCBpbiBldmVudEJ1Y2tldCkge1xuICAgICAgICAgICAgdmFyIGNiUXVldWUgPSBldmVudEJ1Y2tldFtidWNrZXRdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2JRdWV1ZSkpIHtcbiAgICAgICAgICAgICAgICBjYlF1ZXVlLmZvckVhY2goZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IuY2FsbCh0aGlzLCBjdHgsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoYnVja2V0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IGJ1Y2tldFtpZF07XG5cbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmbiwgaSkge1xuICAgICAgICAgICAgaWYoZm4gPT09IGZ1bmMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCwgaWQsIGV2ZW50cykge1xuICAgIGlmIChldmVudCkge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gXG5cbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZ0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bnN1YnNyaWJlT25lKGV2ZW50KSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgICAgIGlmIChidWNrZXQgJiYgYnVja2V0W2lkXSkge1xuICAgICAgICAgICAgZGVsZXRlIGJ1Y2tldFtpZF07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50QnVzO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgY291bnQgPSAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBzdHIgKyBjb3VudDtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbn07XG5cbiIsInZhciBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwvbW9kZWwnKTtcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2NvbnRyb2xsZXInKTtcbnZhciBWaWV3ID0gcmVxdWlyZSgnLi92aWV3L3ZpZXcnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4vc3R5bGl6ZXIvc3R5bGl6ZXInKTtcbnZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBWb3cgPSByZXF1aXJlKCcuL3Zvdy92b3cnKTtcblxudmFyIGdFdmVudEJ1cztcbndpbmRvdy5tb2R1bGVTdG9yZSA9IHt9O1xuXG52YXIgVHJpbyA9IHtcbiAgICBNb2RlbDogTW9kZWwsXG4gICAgQ29udHJvbGxlcjogQ29udHJvbGxlcixcbiAgICBWaWV3OiBWaWV3LFxuICAgIFN0eWxpemVyOiBTdHlsaXplcixcbiAgICBWb3c6IFZvd1xufVxuXG5mb3IgKHZhciBrZXkgaW4gVHJpbykge1xuICAgIFRyaW9ba2V5XS5leHRlbmQgPSBleHRlbmQ7XG59XG5cblRyaW8uc3RhcnQgPSBmdW5jdGlvbihjYikge1xuICAgIGdFdmVudEJ1cyA9IG5ldyBFdmVudEJ1cygpO1xuICAgIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5UcmlvLmdldEdsb2JhbEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFnRXZlbnRCdXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWVkIHRvIHN0YXJ0IGFwcGxpY2FpdG9uIGZpcnN0LicpO1xuICAgIH1cbiAgICByZXR1cm4gZ0V2ZW50QnVzO1xufTtcblxuVHJpby5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuYztcbn07XG5cblRyaW8uaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgIHZhciBsb2FkZWQgPSAwO1xuICAgIHZhciBjb3VudCAgPSBPYmplY3Qua2V5cyhtb2R1bGVzKTtcbiAgICB2YXIgdm93ID0gVHJpby5Wb3coKTtcbiAgICB2YXIgcmV0ID0ge307XG4gICAgdmFyIHVybDtcblxuICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuICAgIHJldHVybiB2b3cucHJvbWlzZTtcblxuICAgIGZ1bmN0aW9uIF9pbXBvcnQoa2V5KSB7XG4gICAgICAgIHZhciB1cmwgPSBtb2R1bGVzW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZVN0b3JlW2tleV07XG5cbiAgICAgICAgaWYgKCFtb2R1bGUpIHtcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICAgICAgICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgICAgICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVyID0gVHJpby5Wb3coKTtcblxuICAgICAgICAgICAgICAgIGRlZmVyLnByb21pc2UudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFtrZXldID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdy5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNjcmlwdC5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0uY2FsbCh0aGlzLCBkZWZlci5yZXNvbHZlKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzLCBrZXkpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyaW87XG5cbmZ1bmN0aW9uIGV4dGVuZChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn0iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdtb2RlbCcpO1xudmFyIE1vZGVsID0ge307XG5cbk1vZGVsLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgICAgIHRoaXMuX3NldChrZXksIHZhbCwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldChrZXksIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMucmVhZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhdHRyaWJ1dGVzKSk7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChvcHRzKTtcbiAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2luaXRpYWxpemUnLCB0aGlzLCBvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3NldCA9IGZ1bmN0aW9uKGtleSwgdmFsLCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldChrLCBrZXlba10sIGF0dHJpYnV0ZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHZhbDtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IHZhbDtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2UnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZTonICsga2V5LCB0aGlzLCB2YWwpO1xuICAgIH1cbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2dldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gYXR0cmlidXRlc1trZXldO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG4iLCJ2YXIgU3R5bGl6ZXIgPSB7fTtcbnZhciBtaXhpbnMgPSB7fTtcbnZhciB2YXJpYWJsZXMgPSB7fTtcblxuU3R5bGl6ZXIuc3RyaW5naWZ5ID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgICB2YXIgcmV0ID0gJyc7XG5cbiAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBzdHlsZSkge1xuICAgICAgICByZXQgKz0gc2VsZWN0b3IgKyAneyc7XG4gICAgICAgIHZhciBwcm9wZXJ0aWVzID0gc3R5bGVbc2VsZWN0b3JdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0gcHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgIHJldCArPSBwcm9wICsgJzonICsgc2V0dGluZyArICc7JztcbiAgICAgICAgfVxuICAgICAgICByZXQgPSByZXQuc2xpY2UoMCwgcmV0Lmxlbmd0aCAtIDEpO1xuICAgICAgICByZXQgKz0gJ30nO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5TdHlsaXplci5yZWdpc3Rlck1peGlucyA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIG1peGluc1trZXldID0gZnVuYztcbn07XG5cblN0eWxpemVyLnJlZ2lzdGVyVmFyaWFibGVzID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICB2YXJpYWJsZXNba2V5XSA9IHZhbDtcbn07XG5cblN0eWxpemVyLmdldFZhcmlhYmxlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIHZhcmlhYmxlc1trZXldO1xufTtcblxuU3R5bGl6ZXIuTWl4aW5zID0gZnVuY3Rpb24oa2V5LCBvcHRzKSB7XG4gICAgaWYgKCFtaXhpbnNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNaXhpbiBmb3IgJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbWl4aW5zW2tleV0uY2FsbCh0aGlzLCBvcHRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGl6ZXI7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4uL3N0eWxpemVyL3N0eWxpemVyJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ3ZpZXcnKTtcbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZTtcbiAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlO1xuXG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuXG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuICAgIGlmIChzdHlsZSkge1xuICAgICAgICB0aGlzLnN0eWxlID0gU3R5bGl6ZXIuc3RyaW5naWZ5KHN0eWxlKTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMucmVuZGVyVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgdmFyIGVsLCBzdHlsZTtcblxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlLmlubmVyVGV4dCA9IHRoaXMuc3R5bGU7XG4gICAgZWwuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZSwgZWwpO1xuXG4gICAgcmV0dXJuIGVsO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudHModGVtcGxhdGUsIGJhc2UpIHtcbiAgICAgICAgZm9yICh2YXIgdGFnIGluIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZFRhZyh0YWcpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gY3JlYXRlT25lRWxlbWVudC5jYWxsKHRoaXMsIHRhZyk7XG4gICAgICAgICAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZVt0YWddLCBlbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdyZWYnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZJbmRleFt0ZW1wbGF0ZVt0YWddXSA9IGJhc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWcgPT09ICdvbkNsaWNrJykge1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50cy5jYWxsKHRoaXMsIGJhc2UsICdjbGljaycgLHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKHBhcnNlZFsxXSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBwYXJzZWRbMl07XG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VkWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGVsLmlkID0gcGFyc2VkWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZEV2ZW50cyhlbCwgb3JpZ2luRXZ0LCBuZXdFdnQpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihvcmlnaW5FdnQsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaChuZXdFdnQsIHRoaXMsIGUpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVGFnKHRhZykge1xuICAgICAgICB0YWcgPSB0YWcucmVwbGFjZSgvWy4jXS8sIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICcsJyArIGQgKyAnLCd9KVxuICAgICAgICAgICAgICAgICAuc3BsaXQoJywnKTtcbiAgICAgICAgcmV0dXJuIHRhZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1ZhbGlkVGFnKHRhZykge1xuICAgICAgICB0YWcgPSB0YWcucmVwbGFjZSgvWy4jXS8sIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICcsJyArIGQgKyAnLCd9KVxuICAgICAgICAgICAgICAgICAuc3BsaXQoJywnKTtcbiAgICAgICAgcmV0dXJuICh0YWdbMV0gPT09ICcjJyB8fCB0YWdbMV0gPT09ICcuJykgJiYgdGFnLmxlbmd0aCA9PT0gMztcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuYXBwZW5kQ29tcG9uZW50VG8gPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICB2YXIgUm9vdCwgcm9vdCwgY2xvbmU7XG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIFxuICAgIFJvb3QgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGhpcy50YWdOYW1lLCB7XG4gICAgICAgIHByb3RvdHlwZTogcHJvdG9cbiAgICB9KTtcblxuICAgIHJvb3QgPSBuZXcgUm9vdCgpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQocm9vdCk7XG4gICAgdGhpcy5yb290ID0gcm9vdC5jcmVhdGVTaGFkb3dSb290KCk7XG4gICAgdGhpcy5yb290LmFwcGVuZENoaWxkKHRoaXMudGVtcGxhdGUpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICAgIGlmICghdGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIGVsLmNsYXNzTmFtZSArPSBcIiBcIiArIGNsYXNzTmFtZTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKHRoaXMuaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICB2YXIgcmVnID0gbmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbGFzc05hbWUrJyhcXFxcc3wkKScpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZWcsJyAnKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuaGFzQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gIHJldHVybiAhIWVsLmNsYXNzTmFtZS5tYXRjaChuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJykpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmVsLnJlbW92ZSgpO1xuICAgIHRoaXMuZWwgPSBudWxsO1xuICAgIHRoaXMucmVmSW5kZXggPSB7fTtcbiAgICB0aGlzLmV2ZW50QnVzLnVuc3Vic2NyaWJlQWxsKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7XG4iLCJ2YXIgTGlua2VkTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgdGhpcy50YWlsID0gbnVsbDtcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLmFkZFRvVGFpbCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHRpY2sgPSB7XG4gICAgICAgIGZ1bmM6IGZuLFxuICAgICAgICBuZXh0OiBudWxsXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmhlYWQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGljaztcbiAgICAgICAgdGhpcy5oZWFkLm5leHQgPSB0aGlzLnRhaWw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFpbCkge1xuICAgICAgICB0aGlzLnRhaWwubmV4dCA9IHRpY2s7XG4gICAgfVxuICAgIHRoaXMudGFpbCA9IHRpY2s7XG59O1xuXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5yZW1vdmVIZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByZXZpb3VzSGVhZDtcblxuICAgIGlmICh0aGlzLmhlYWQpIHtcbiAgICAgICAgcHJldmlvdXNIZWFkID0gdGhpcy5oZWFkLmZ1bmM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhZC5uZXh0KSB7XG4gICAgICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGFpbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzSGVhZDtcbn07XG5cbnZhciBQRU5ESU5HICA9IHt9LFxuICAgIFJFU09MVkVEID0ge30sXG4gICAgUkVKRUNURUQgPSB7fTsgXG5cbnZhciBWb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdm93ID0ge307XG5cbiAgICB2YXIgc3RhdHVzICAgICAgID0gUEVORElORztcbiAgICB2YXIgcmVzb2x2ZVRpY2tzID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgcmVqZWN0VGlja3MgID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgZG9uZVRpY2ssIGV4Y2VwdGlvbiwgdmFsLCBmbjtcblxuICAgIHZvdy5yZXNvbHZlID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgIGlmIChzdGF0dXMgPT09IFJFSkVDVEVEIHx8ICFyZXNvbHZlVGlja3MuaGVhZCkge1xuICAgICAgICAgICAgaGFuZGxlRG9uZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzID0gUkVTT0xWRUQ7XG4gICAgICAgIHZhbCA9IHJldDtcblxuICAgICAgICBmbiA9IHJlc29sdmVUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhbCA9IGZuLmNhbGwodGhpcywgcmV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBzdGF0dXMgPSBSRUpFQ1RFRDtcbiAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICB2b3cucmVqZWN0KGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdm93LnJlc29sdmUodmFsKTtcbiAgICB9O1xuXG4gICAgdm93LnJlamVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVTT0xWRUQgfHwgIXJlamVjdFRpY2tzLmhlYWQpIHtcbiAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICBleGNlcHRpb24gPSBlO1xuXG4gICAgICAgIGZuID0gcmVqZWN0VGlja3MucmVtb3ZlSGVhZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV4Y2VwdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9O1xuXG5cbiAgICB2b3cucHJvbWlzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB7fVxuXG4gICAgICAgIHByb21pc2UudGhlbiA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIHJlc29sdmVUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmNhdGNoID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVqZWN0VGlja3MuYWRkVG9UYWlsKGZ1bmMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJvbWlzZS5kb25lID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgZG9uZVRpY2sgPSBmdW5jO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuXG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2b3c7XG4gICAgXG4gICAgZnVuY3Rpb24gaGFuZGxlRG9uZSgpIHtcbiAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkb25lVGljaykge1xuICAgICAgICAgICAgZG9uZVRpY2suY2FsbCh0aGlzLCB2YWwpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVm93O1xuXG4iLCJ3aW5kb3cuVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTsiXX0=
