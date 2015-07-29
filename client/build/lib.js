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
    return (function(context) {
        var evt = {}
        evt.subscribe = function(event, func) {
            context._subscribe(event, func, id, events);
        };
        evt.publish = function(event, ctx, args) {
            context._publish(event, ctx, args, events);
        };
        evt.unsubscribe = function(event, func) {
            context._unsubscribe(event, func, id, events);
        };
        evt.unsubscribeAll = function(event) {
            context._unsubscribeAll(event, id, events);
        }
        return evt;
    })(this);
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
var Module = require('./module/module');
var Vow = require('./vow/vow');

var gEventBus = new EventBus();;

var Trio = {
    Model: Model,
    Controller: Controller,
    View: View,
    Vow: Vow,
    Stylizer: new Stylizer(),
    Module: new Module()
}

for (var key in Trio) {
    Trio[key].extend = extend;
}

Trio.registerGlobalEventBus = function(id) {
    return gEventBus.register(id);
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
},{"./controller/controller":1,"./eventBus/eventBus":2,"./model/model":5,"./module/module":6,"./stylizer/stylizer":7,"./view/view":8,"./vow/vow":9}],5:[function(require,module,exports){
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
    this.eventBus = this.eventBus.register(this.id);

    this.set = function(key, val) {
        this._set(key, val, attributes);
    }

    this.get = function(key) {
        return this._get(key, attributes);
    }

    this.clone = function() {
        return JSON.parse(JSON.stringify(attributes));
    }

    if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }

    this.set(_default(this.defaults, opts));
    this.eventBus.publish('initialize', this, opts);

    function _default(def, opts) {
        def = def || {}
        for (var key in opts) {
            def[key] = opts[key];
        }
        return def;
    }
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
var Vow = require('../vow/vow');
var moduleStore = {};

var Module = function() {
}

Module.prototype.export = function(key, func) {
    if (typeof key !== 'string') {
        throw new Error('Module name is not a string.');
    }

    if (typeof func !== 'function') {
        throw new Error('Module is not a function.');
    }
    moduleStore[key] = func;
};

Module.prototype.import = function(modules) {
    var loaded = 0;
    var count  = Object.keys(modules);
    var vow = Vow();
    var ret = {};
    var url;

    _import(count.pop());

    vow.promise.and = {};
    vow.promise.and.export = function(key, func) {
        this.export(key, function(done) {
            vow.promise
                .then(function(ret) {
                    return func.call(this, ret, done);
                }.bind(this));
        });
    }.bind(this);

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
                var defer = Vow();
                console.log('Loading ' + key + '...');
                defer.promise.then(function(data) {
                    ret[key] = data;
                    loaded++;
                    if (count.length === 0) {
                        vow.resolve(ret);
                    } else {
                        _import(count.pop());
                    }
                });

                script.remove();
                moduleStore[key].call(this, defer.resolve);
            }.bind(this, key);
            document.body.appendChild(script);
        }
    }
};

module.exports = Module;

},{"../vow/vow":9}],7:[function(require,module,exports){
var mixins = {};
var variables = {};

var Stylizer = function() {

};

Stylizer.prototype.stringify = function(style) {
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

Stylizer.prototype.registerMixins = function(key, func) {
    mixins[key] = func;
};

Stylizer.prototype.registerVariables = function(key, val) {
    variables[key] = val;
};

Stylizer.prototype.getVariable = function(key) {
    if (!variables[key]) {
        console.error('Variable ' + key + ' does not exist.');
        return;
    }
    return variables[key];
};

Stylizer.prototype.getMixins = function(key, opts) {
    if (!mixins[key]) {
        console.error('Mixin ' + key + ' does not exist.');
        return;
    }
    return mixins[key].call(this, opts);
};

module.exports = Stylizer;
},{}],8:[function(require,module,exports){
var EventBus = require('../eventBus/eventBus');
var Stylizer = require('../stylizer/stylizer');
var IdGenerator = require('../helpers/IdGenerator')('view');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    var template = this.template || {};
    var style = this.style || {};
    var styleTag, inlineStyle;

    this.id = IdGenerator();
    this.refIndex = {};

    this.eventBus = opts.eventBus || new EventBus();
    this.eventBus = this.eventBus.register(this.id);


    if (this.isWebComponent) {
        this.style = Stylizer.prototype.stringify(style);
        this.template = this.renderTemplate(template);
        styleTag = document.createElement('style');
        styleTag.innerText = this.style;
        this.template.appendChild(styleTag)
        this.createComponent();
    } else {
        inlineStyle = this.style[':host'] || {};
        this.template = this.renderTemplate(template);
        this.createElement();
        for (var attr in inlineStyle) {
            this.el.style[attr] = inlineStyle[attr];
        }
    }

    if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.renderTemplate = function(template) {
    var el;

    el = document.createDocumentFragment();

    createElements.call(this, template, el);

    return el;

    function createElements(template, base) {
        for (var tag in template) {
            if (isValidTag(tag)) {
                var el = createOneElement.call(this, tag);
                if (!this.isWebComponent && this.style[tag]) {
                    addInlineStyle(el, this.style[tag]);
                }
                base.appendChild(el);
                createElements.call(this, template[tag], el);
            } else if (tag === 'ref') {
                this.refIndex[template[tag]] = base;
            } else {
                addEvents.call(this, base, tag, template[tag]);
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

    function addInlineStyle(el, style) {
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

View._constructor.prototype.createElement = function() {
    var Root, root;
    var proto = Object.create(HTMLElement.prototype);
    
    Root = document.registerElement(this.tagName, {
        prototype: proto
    });

    this.el = new Root()
    this.el.appendChild(this.template);

    return this;
};

View._constructor.prototype.createComponent = function() {
    var view = this;
    var Root, root;
    var proto = Object.create(HTMLElement.prototype);
    
    proto.createdCallback = function() {
        var shadow = this.createShadowRoot();
        shadow.appendChild(view.template);
    };

    Root = document.registerElement(this.tagName, {
        prototype: proto
    });

    this.el = new Root()

    return this;
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

},{"../eventBus/eventBus":2,"../helpers/IdGenerator":3,"../stylizer/stylizer":7}],9:[function(require,module,exports){
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

        catch (err) {
            exception = err;
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

        resolveTicks = null;
        rejectTicks  = null;
        doneTick     = null;
        exception    = null;
        val          = null;
        fn           = null;

    };
};

module.exports = Vow;


},{}],10:[function(require,module,exports){
window.Trio = require('trio');
},{"trio":4}]},{},[10])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2RlbC9tb2RlbC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvbW9kdWxlL21vZHVsZS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdm93L3Zvdy5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnY29udHJvbGxlcicpO1xudmFyIENvbnRyb2xsZXIgPSB7fTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLm1vZGVsID0gb3B0cy5tb2RlbCB8fCBudWxsO1xuICAgIHRoaXMudmlldyA9IG9wdHMudmlldyB8fCBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbn07XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy52aWV3RXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy52aWV3RXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGhpcy52aWV3LmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBldnQgaW4gdGhpcy5tb2RlbEV2ZW50cykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMubW9kZWxFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLm1vZGVsLmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7IiwidmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBpZCA9IGlkO1xuICAgIHZhciBldmVudHMgPSB7fTtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGV2dCA9IHt9XG4gICAgICAgIGV2dC5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICAgICAgY29udGV4dC5fc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnB1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll9wdWJsaXNoKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll91bnN1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC51bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBjb250ZXh0Ll91bnN1YnNjcmliZUFsbChldmVudCwgaWQsIGV2ZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV2dDtcbiAgICB9KSh0aGlzKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoIWV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XSA9IHt9O1xuICAgIH1cblxuICAgIGlmICghZXZlbnRzW2V2ZW50XVtpZF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XVtpZF0gPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGNhbGxiYWNrIGZ1bmN0aW9uIG11c3QgYmUgcGFzc2VkIGluIHRvIHN1YnNjcmliZScpO1xuICAgIH1cbiAgICBcbiAgICBldmVudHNbZXZlbnRdW2lkXS5wdXNoKGZ1bmMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKSB7XG4gICAgY3R4ID0gY3R4IHx8IG51bGw7XG4gICAgYXJncyA9IGFyZ3MgfHwgbnVsbDtcblxuICAgIHZhciBldmVudEJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgZm9yICh2YXIgYnVja2V0IGluIGV2ZW50QnVja2V0KSB7XG4gICAgICAgICAgICB2YXIgY2JRdWV1ZSA9IGV2ZW50QnVja2V0W2J1Y2tldF07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYlF1ZXVlKSkge1xuICAgICAgICAgICAgICAgIGNiUXVldWUuZm9yRWFjaChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgICAgICAgICBjYi5jYWxsKHRoaXMsIGN0eCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChidWNrZXQpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gYnVja2V0W2lkXTtcblxuICAgICAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGZuLCBpKSB7XG4gICAgICAgICAgICBpZihmbiA9PT0gZnVuYykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50LCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgfSBcblxuICAgIGZvciAodmFyIGV2dCBpbiBldmVudHMpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuc3Vic3JpYmVPbmUoZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICAgICAgaWYgKGJ1Y2tldCAmJiBidWNrZXRbaWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgYnVja2V0W2lkXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRCdXM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBjb3VudCA9IDE7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IHN0ciArIGNvdW50O1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxufTtcblxuIiwidmFyIE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbC9tb2RlbCcpO1xudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXIvY29udHJvbGxlcicpO1xudmFyIFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcvdmlldycpO1xudmFyIFN0eWxpemVyID0gcmVxdWlyZSgnLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4vbW9kdWxlL21vZHVsZScpO1xudmFyIFZvdyA9IHJlcXVpcmUoJy4vdm93L3ZvdycpO1xuXG52YXIgZ0V2ZW50QnVzID0gbmV3IEV2ZW50QnVzKCk7O1xuXG52YXIgVHJpbyA9IHtcbiAgICBNb2RlbDogTW9kZWwsXG4gICAgQ29udHJvbGxlcjogQ29udHJvbGxlcixcbiAgICBWaWV3OiBWaWV3LFxuICAgIFZvdzogVm93LFxuICAgIFN0eWxpemVyOiBuZXcgU3R5bGl6ZXIoKSxcbiAgICBNb2R1bGU6IG5ldyBNb2R1bGUoKVxufVxuXG5mb3IgKHZhciBrZXkgaW4gVHJpbykge1xuICAgIFRyaW9ba2V5XS5leHRlbmQgPSBleHRlbmQ7XG59XG5cblRyaW8ucmVnaXN0ZXJHbG9iYWxFdmVudEJ1cyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIGdFdmVudEJ1cy5yZWdpc3RlcihpZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyaW87XG5cbmZ1bmN0aW9uIGV4dGVuZChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn0iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdtb2RlbCcpO1xudmFyIE1vZGVsID0ge307XG5cbk1vZGVsLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICB0aGlzLl9zZXQoa2V5LCB2YWwsIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF0dHJpYnV0ZXMpKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChfZGVmYXVsdCh0aGlzLmRlZmF1bHRzLCBvcHRzKSk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplJywgdGhpcywgb3B0cyk7XG5cbiAgICBmdW5jdGlvbiBfZGVmYXVsdChkZWYsIG9wdHMpIHtcbiAgICAgICAgZGVmID0gZGVmIHx8IHt9XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRzKSB7XG4gICAgICAgICAgICBkZWZba2V5XSA9IG9wdHNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmO1xuICAgIH1cbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3NldCA9IGZ1bmN0aW9uKGtleSwgdmFsLCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldChrLCBrZXlba10sIGF0dHJpYnV0ZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHZhbDtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IHZhbDtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2UnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZTonICsga2V5LCB0aGlzLCB2YWwpO1xuICAgIH1cbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2dldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gYXR0cmlidXRlc1trZXldO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG4iLCJ2YXIgVm93ID0gcmVxdWlyZSgnLi4vdm93L3ZvdycpO1xudmFyIG1vZHVsZVN0b3JlID0ge307XG5cbnZhciBNb2R1bGUgPSBmdW5jdGlvbigpIHtcbn1cblxuTW9kdWxlLnByb3RvdHlwZS5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuYztcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgIHZhciBsb2FkZWQgPSAwO1xuICAgIHZhciBjb3VudCAgPSBPYmplY3Qua2V5cyhtb2R1bGVzKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG4gICAgdmFyIHJldCA9IHt9O1xuICAgIHZhciB1cmw7XG5cbiAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcblxuICAgIHZvdy5wcm9taXNlLmFuZCA9IHt9O1xuICAgIHZvdy5wcm9taXNlLmFuZC5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5leHBvcnQoa2V5LCBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgICAgICB2b3cucHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJldCwgZG9uZSk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHZvdy5wcm9taXNlO1xuXG4gICAgZnVuY3Rpb24gX2ltcG9ydChrZXkpIHtcbiAgICAgICAgdmFyIHVybCA9IG1vZHVsZXNba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIG5hbWUgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB1cmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VSTCBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbW9kdWxlID0gbW9kdWxlU3RvcmVba2V5XTtcblxuICAgICAgICBpZiAoIW1vZHVsZSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgc2NyaXB0LnR5cGUgPSBcInRleHQvamF2YXNjcmlwdFwiO1xuICAgICAgICAgICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXIgPSBWb3coKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTG9hZGluZyAnICsga2V5ICsgJy4uLicpO1xuICAgICAgICAgICAgICAgIGRlZmVyLnByb21pc2UudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFtrZXldID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdy5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2NyaXB0LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0uY2FsbCh0aGlzLCBkZWZlci5yZXNvbHZlKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzLCBrZXkpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCJ2YXIgbWl4aW5zID0ge307XG52YXIgdmFyaWFibGVzID0ge307XG5cbnZhciBTdHlsaXplciA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgICB2YXIgcmV0ID0gJyc7XG5cbiAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBzdHlsZSkge1xuICAgICAgICByZXQgKz0gc2VsZWN0b3IgKyAneyc7XG4gICAgICAgIHZhciBwcm9wZXJ0aWVzID0gc3R5bGVbc2VsZWN0b3JdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0gcHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgIHJldCArPSBwcm9wICsgJzonICsgc2V0dGluZyArICc7JztcbiAgICAgICAgfVxuICAgICAgICByZXQgPSByZXQuc2xpY2UoMCwgcmV0Lmxlbmd0aCAtIDEpO1xuICAgICAgICByZXQgKz0gJ30nO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUucmVnaXN0ZXJNaXhpbnMgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBtaXhpbnNba2V5XSA9IGZ1bmM7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUucmVnaXN0ZXJWYXJpYWJsZXMgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgIHZhcmlhYmxlc1trZXldID0gdmFsO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmdldFZhcmlhYmxlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCF2YXJpYWJsZXNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdWYXJpYWJsZSAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdmFyaWFibGVzW2tleV07XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuZ2V0TWl4aW5zID0gZnVuY3Rpb24oa2V5LCBvcHRzKSB7XG4gICAgaWYgKCFtaXhpbnNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNaXhpbiAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbWl4aW5zW2tleV0uY2FsbCh0aGlzLCBvcHRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGl6ZXI7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4uL3N0eWxpemVyL3N0eWxpemVyJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ3ZpZXcnKTtcbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZSB8fCB7fTtcbiAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlIHx8IHt9O1xuICAgIHZhciBzdHlsZVRhZywgaW5saW5lU3R5bGU7XG5cbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG5cbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuXG4gICAgaWYgKHRoaXMuaXNXZWJDb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5zdHlsZSA9IFN0eWxpemVyLnByb3RvdHlwZS5zdHJpbmdpZnkoc3R5bGUpO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJUZXh0ID0gdGhpcy5zdHlsZTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZS5hcHBlbmRDaGlsZChzdHlsZVRhZylcbiAgICAgICAgdGhpcy5jcmVhdGVDb21wb25lbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmxpbmVTdHlsZSA9IHRoaXMuc3R5bGVbJzpob3N0J10gfHwge307XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLnJlbmRlclRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50KCk7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gaW5saW5lU3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuc3R5bGVbYXR0cl0gPSBpbmxpbmVTdHlsZVthdHRyXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgdmFyIGVsO1xuXG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlLCBlbCk7XG5cbiAgICByZXR1cm4gZWw7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50cyh0ZW1wbGF0ZSwgYmFzZSkge1xuICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChpc1ZhbGlkVGFnKHRhZykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBjcmVhdGVPbmVFbGVtZW50LmNhbGwodGhpcywgdGFnKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNXZWJDb21wb25lbnQgJiYgdGhpcy5zdHlsZVt0YWddKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZElubGluZVN0eWxlKGVsLCB0aGlzLnN0eWxlW3RhZ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlW3RhZ10sIGVsKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnID09PSAncmVmJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmSW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRFdmVudHMuY2FsbCh0aGlzLCBiYXNlLCB0YWcsIHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKHBhcnNlZFsxXSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBwYXJzZWRbMl07XG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VkWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGVsLmlkID0gcGFyc2VkWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZElubGluZVN0eWxlKGVsLCBzdHlsZSkge1xuICAgICAgICBmb3IgKHZhciBhdHRyIGluIHN0eWxlKSB7XG4gICAgICAgICAgICBlbC5zdHlsZVthdHRyXSA9IHN0eWxlW2F0dHJdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkRXZlbnRzKGVsLCBvcmlnaW5FdnQsIG5ld0V2dCkge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKG9yaWdpbkV2dCwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKG5ld0V2dCwgdGhpcywgZSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gdGFnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVmFsaWRUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gKHRhZ1sxXSA9PT0gJyMnIHx8IHRhZ1sxXSA9PT0gJy4nKSAmJiB0YWcubGVuZ3RoID09PSAzO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIFJvb3QsIHJvb3Q7XG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIFxuICAgIFJvb3QgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGhpcy50YWdOYW1lLCB7XG4gICAgICAgIHByb3RvdHlwZTogcHJvdG9cbiAgICB9KTtcblxuICAgIHRoaXMuZWwgPSBuZXcgUm9vdCgpXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZUNvbXBvbmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2aWV3ID0gdGhpcztcbiAgICB2YXIgUm9vdCwgcm9vdDtcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgXG4gICAgcHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzaGFkb3cgPSB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKHZpZXcudGVtcGxhdGUpO1xuICAgIH07XG5cbiAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICBwcm90b3R5cGU6IHByb3RvXG4gICAgfSk7XG5cbiAgICB0aGlzLmVsID0gbmV3IFJvb3QoKVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKCF0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgZWwuY2xhc3NOYW1lICs9IFwiIFwiICsgY2xhc3NOYW1lO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAodGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlZywnICcpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgcmV0dXJuICEhZWwuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKSk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWwucmVtb3ZlKCk7XG4gICAgdGhpcy5lbCA9IG51bGw7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMudW5zdWJzY3JpYmVBbGwoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiIsInZhciBMaW5rZWRMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB0aGlzLnRhaWwgPSBudWxsO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkVG9UYWlsID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgdGljayA9IHtcbiAgICAgICAgZnVuYzogZm4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhZCkge1xuICAgICAgICB0aGlzLmhlYWQgPSB0aWNrO1xuICAgICAgICB0aGlzLmhlYWQubmV4dCA9IHRoaXMudGFpbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YWlsKSB7XG4gICAgICAgIHRoaXMudGFpbC5uZXh0ID0gdGljaztcbiAgICB9XG4gICAgXG4gICAgdGhpcy50YWlsID0gdGljaztcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLnJlbW92ZUhlYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJldmlvdXNIZWFkO1xuXG4gICAgaWYgKHRoaXMuaGVhZCkge1xuICAgICAgICBwcmV2aW91c0hlYWQgPSB0aGlzLmhlYWQuZnVuYztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWFkLm5leHQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGhpcy5oZWFkLm5leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50YWlsID0gbnVsbDtcbiAgICAgICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlvdXNIZWFkO1xufTtcblxudmFyIFBFTkRJTkcgID0ge30sXG4gICAgUkVTT0xWRUQgPSB7fSxcbiAgICBSRUpFQ1RFRCA9IHt9OyBcblxudmFyIFZvdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2b3cgPSB7fTtcblxuICAgIHZhciBzdGF0dXMgICAgICAgPSBQRU5ESU5HO1xuICAgIHZhciByZXNvbHZlVGlja3MgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciByZWplY3RUaWNrcyAgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciBkb25lVGljaywgZXhjZXB0aW9uLCB2YWwsIGZuO1xuXG4gICAgdm93LnJlc29sdmUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVKRUNURUQgfHwgIXJlc29sdmVUaWNrcy5oZWFkKSB7XG4gICAgICAgICAgICBoYW5kbGVEb25lKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0dXMgPSBSRVNPTFZFRDtcbiAgICAgICAgdmFsID0gcmV0O1xuXG4gICAgICAgIGZuID0gcmVzb2x2ZVRpY2tzLnJlbW92ZUhlYWQoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFsID0gZm4uY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIHZvdy5yZWplY3QoZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2b3cucmVzb2x2ZSh2YWwpO1xuICAgIH07XG5cbiAgICB2b3cucmVqZWN0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoc3RhdHVzID09PSBSRVNPTFZFRCB8fCAhcmVqZWN0VGlja3MuaGVhZCkge1xuICAgICAgICAgICAgaGFuZGxlRG9uZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdHVzID0gUkVKRUNURUQ7XG4gICAgICAgIGV4Y2VwdGlvbiA9IGU7XG5cbiAgICAgICAgZm4gPSByZWplY3RUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGVycjtcbiAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9O1xuXG5cbiAgICB2b3cucHJvbWlzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB7fVxuXG4gICAgICAgIHByb21pc2UudGhlbiA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIHJlc29sdmVUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmNhdGNoID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVqZWN0VGlja3MuYWRkVG9UYWlsKGZ1bmMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJvbWlzZS5kb25lID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgZG9uZVRpY2sgPSBmdW5jO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuXG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2b3c7XG4gICAgXG4gICAgZnVuY3Rpb24gaGFuZGxlRG9uZSgpIHtcbiAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkb25lVGljaykge1xuICAgICAgICAgICAgZG9uZVRpY2suY2FsbCh0aGlzLCB2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVRpY2tzID0gbnVsbDtcbiAgICAgICAgcmVqZWN0VGlja3MgID0gbnVsbDtcbiAgICAgICAgZG9uZVRpY2sgICAgID0gbnVsbDtcbiAgICAgICAgZXhjZXB0aW9uICAgID0gbnVsbDtcbiAgICAgICAgdmFsICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgZm4gICAgICAgICAgID0gbnVsbDtcblxuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZvdztcblxuIiwid2luZG93LlRyaW8gPSByZXF1aXJlKCd0cmlvJyk7Il19
