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
};

Module.prototype.export = function(key, func) {
    if (typeof key !== 'string') {
        throw new Error('Module name is not a string.');
    }

    if (typeof func !== 'function') {
        throw new Error('Module is not a function.');
    }
    moduleStore[key] = function(done) {
        done(func());
    };
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
        moduleStore[key] = function(done) {
            vow.promise
                .then(function(ret) {
                    moduleStore[key] = func.bind(this, ret);
                    return func.call(this, ret);
                }.bind(this))
                .done(done);
        };
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
                moduleStore[key](defer.resolve);
            }.bind(this, key);

            document.body.appendChild(script);
        } else {
            vow.resolve(module());
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
    

    try {
        Root = document.registerElement(this.tagName, {
            prototype: proto
        });
        this.el = new Root()
    } catch (e) {
        this.el = document.createElement(this.tagName);
    }

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

    try {
        Root = document.registerElement(this.tagName, {
            prototype: proto
        });
        this.el = new Root()
    } catch (e) {
        this.el = document.createElement(this.tagName);
    }


    return this;

    function isRegisted (name) {
      return document.createElement(name).constructor !== HTMLElement;
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
        setTimeout(function(){
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
        }.bind(this), 0);
    };

    vow.reject = function(e) {
        setTimeout(function(){
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
        }.bind(this), 0);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2RlbC9tb2RlbC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvbW9kdWxlL21vZHVsZS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdm93L3Zvdy5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2NvbnRyb2xsZXInKTtcbnZhciBDb250cm9sbGVyID0ge307XG5cbkNvbnRyb2xsZXIuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5tb2RlbCA9IG9wdHMubW9kZWwgfHwgbnVsbDtcbiAgICB0aGlzLnZpZXcgPSBvcHRzLnZpZXcgfHwgbnVsbDtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuX2FkZEV2ZW50TGlzdGVuZXJzKCk7XG59O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2FkZEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgZXZ0IGluIHRoaXMudmlld0V2ZW50cykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMudmlld0V2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMudmlldy5ldmVudEJ1cy5zdWJzY3JpYmUoZXZ0LCBmbik7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZXZ0IGluIHRoaXMubW9kZWxFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLm1vZGVsRXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGhpcy5tb2RlbC5ldmVudEJ1cy5zdWJzY3JpYmUoZXZ0LCBmbik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyOyIsInZhciBFdmVudEJ1cyA9IGZ1bmN0aW9uKCkge1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgaWQgPSBpZDtcbiAgICB2YXIgZXZlbnRzID0ge307XG4gICAgcmV0dXJuIChmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICAgIHZhciBldnQgPSB7fVxuICAgICAgICBldnQuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3N1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC5wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncykge1xuICAgICAgICAgICAgY29udGV4dC5fcHVibGlzaChldmVudCwgY3R4LCBhcmdzLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICAgICAgY29udGV4dC5fdW5zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgY29udGV4dC5fdW5zdWJzY3JpYmVBbGwoZXZlbnQsIGlkLCBldmVudHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBldnQ7XG4gICAgfSkodGhpcyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3N1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKCFldmVudHNbZXZlbnRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF0gPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50c1tldmVudF1baWRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF1baWRdID0gW107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHBhc3NlZCBpbiB0byBzdWJzY3JpYmUnKTtcbiAgICB9XG4gICAgXG4gICAgZXZlbnRzW2V2ZW50XVtpZF0ucHVzaChmdW5jKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fcHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cykge1xuICAgIGN0eCA9IGN0eCB8fCBudWxsO1xuICAgIGFyZ3MgPSBhcmdzIHx8IG51bGw7XG5cbiAgICB2YXIgZXZlbnRCdWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGV2ZW50QnVja2V0KSB7XG4gICAgICAgIGZvciAodmFyIGJ1Y2tldCBpbiBldmVudEJ1Y2tldCkge1xuICAgICAgICAgICAgdmFyIGNiUXVldWUgPSBldmVudEJ1Y2tldFtidWNrZXRdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2JRdWV1ZSkpIHtcbiAgICAgICAgICAgICAgICBjYlF1ZXVlLmZvckVhY2goZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IuY2FsbCh0aGlzLCBjdHgsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoYnVja2V0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IGJ1Y2tldFtpZF07XG5cbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmbiwgaSkge1xuICAgICAgICAgICAgaWYoZm4gPT09IGZ1bmMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCwgaWQsIGV2ZW50cykge1xuICAgIGlmIChldmVudCkge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gXG5cbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZ0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bnN1YnNyaWJlT25lKGV2ZW50KSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgICAgIGlmIChidWNrZXQgJiYgYnVja2V0W2lkXSkge1xuICAgICAgICAgICAgZGVsZXRlIGJ1Y2tldFtpZF07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50QnVzO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgY291bnQgPSAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBzdHIgKyBjb3VudDtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbn07XG5cbiIsInZhciBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwvbW9kZWwnKTtcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2NvbnRyb2xsZXInKTtcbnZhciBWaWV3ID0gcmVxdWlyZSgnLi92aWV3L3ZpZXcnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4vc3R5bGl6ZXIvc3R5bGl6ZXInKTtcbnZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBNb2R1bGUgPSByZXF1aXJlKCcuL21vZHVsZS9tb2R1bGUnKTtcbnZhciBWb3cgPSByZXF1aXJlKCcuL3Zvdy92b3cnKTtcblxudmFyIGdFdmVudEJ1cyA9IG5ldyBFdmVudEJ1cygpOztcblxudmFyIFRyaW8gPSB7XG4gICAgTW9kZWw6IE1vZGVsLFxuICAgIENvbnRyb2xsZXI6IENvbnRyb2xsZXIsXG4gICAgVmlldzogVmlldyxcbiAgICBWb3c6IFZvdyxcbiAgICBTdHlsaXplcjogbmV3IFN0eWxpemVyKCksXG4gICAgTW9kdWxlOiBuZXcgTW9kdWxlKClcbn1cblxuZm9yICh2YXIga2V5IGluIFRyaW8pIHtcbiAgICBUcmlvW2tleV0uZXh0ZW5kID0gZXh0ZW5kO1xufVxuXG5UcmlvLnJlZ2lzdGVyR2xvYmFsRXZlbnRCdXMgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiBnRXZlbnRCdXMucmVnaXN0ZXIoaWQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmlvO1xuXG5mdW5jdGlvbiBleHRlbmQobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcblxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnbW9kZWwnKTtcbnZhciBNb2RlbCA9IHt9O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICAgICAgdGhpcy5fc2V0KGtleSwgdmFsLCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KGtleSwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhdHRyaWJ1dGVzKSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQoX2RlZmF1bHQodGhpcy5kZWZhdWx0cywgb3B0cykpO1xuICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnaW5pdGlhbGl6ZScsIHRoaXMsIG9wdHMpO1xuXG4gICAgZnVuY3Rpb24gX2RlZmF1bHQoZGVmLCBvcHRzKSB7XG4gICAgICAgIGRlZiA9IGRlZiB8fCB7fVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0cykge1xuICAgICAgICAgICAgZGVmW2tleV0gPSBvcHRzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZjtcbiAgICB9XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9zZXQgPSBmdW5jdGlvbihrZXksIHZhbCwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLl9zZXQoaywga2V5W2tdLCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWw7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlJywgdGhpcywgcmV0KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2U6JyArIGtleSwgdGhpcywgdmFsKTtcbiAgICB9XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9nZXQgPSBmdW5jdGlvbihrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXNba2V5XTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcbnZhciBtb2R1bGVTdG9yZSA9IHt9O1xuXG52YXIgTW9kdWxlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgIGRvbmUoZnVuYygpKTtcbiAgICB9O1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihtb2R1bGVzKSB7XG4gICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgdmFyIGNvdW50ICA9IE9iamVjdC5rZXlzKG1vZHVsZXMpO1xuICAgIHZhciB2b3cgPSBWb3coKTtcbiAgICB2YXIgcmV0ID0ge307XG4gICAgdmFyIHVybDtcblxuICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuXG4gICAgdm93LnByb21pc2UuYW5kID0ge307XG4gICAgdm93LnByb21pc2UuYW5kLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgICAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICAgICAgdm93LnByb21pc2VcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmMuYmluZCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgIC5kb25lKGRvbmUpO1xuICAgICAgICB9O1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB2b3cucHJvbWlzZTtcblxuICAgIGZ1bmN0aW9uIF9pbXBvcnQoa2V5KSB7XG4gICAgICAgIHZhciB1cmwgPSBtb2R1bGVzW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZVN0b3JlW2tleV07XG4gICAgICAgIFxuICAgICAgICBpZiAoIW1vZHVsZSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICAgICAgICBzY3JpcHQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gICAgICAgICAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlciA9IFZvdygpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgJyArIGtleSArICcuLi4nKTtcblxuICAgICAgICAgICAgICAgIGRlZmVyLnByb21pc2UudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFtrZXldID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdy5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2NyaXB0LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0oZGVmZXIucmVzb2x2ZSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcywga2V5KTtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm93LnJlc29sdmUobW9kdWxlKCkpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCJ2YXIgbWl4aW5zID0ge307XG52YXIgdmFyaWFibGVzID0ge307XG5cbnZhciBTdHlsaXplciA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgICB2YXIgcmV0ID0gJyc7XG5cbiAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBzdHlsZSkge1xuICAgICAgICByZXQgKz0gc2VsZWN0b3IgKyAneyc7XG4gICAgICAgIHZhciBwcm9wZXJ0aWVzID0gc3R5bGVbc2VsZWN0b3JdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0gcHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgIHJldCArPSBwcm9wICsgJzonICsgc2V0dGluZyArICc7JztcbiAgICAgICAgfVxuICAgICAgICByZXQgPSByZXQuc2xpY2UoMCwgcmV0Lmxlbmd0aCAtIDEpO1xuICAgICAgICByZXQgKz0gJ30nO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUucmVnaXN0ZXJNaXhpbnMgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBtaXhpbnNba2V5XSA9IGZ1bmM7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUucmVnaXN0ZXJWYXJpYWJsZXMgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgIHZhcmlhYmxlc1trZXldID0gdmFsO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmdldFZhcmlhYmxlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCF2YXJpYWJsZXNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdWYXJpYWJsZSAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdmFyaWFibGVzW2tleV07XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuZ2V0TWl4aW5zID0gZnVuY3Rpb24oa2V5LCBvcHRzKSB7XG4gICAgaWYgKCFtaXhpbnNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNaXhpbiAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbWl4aW5zW2tleV0uY2FsbCh0aGlzLCBvcHRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGl6ZXI7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4uL3N0eWxpemVyL3N0eWxpemVyJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ3ZpZXcnKTtcbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZSB8fCB7fTtcbiAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlIHx8IHt9O1xuICAgIHZhciBzdHlsZVRhZywgaW5saW5lU3R5bGU7XG5cbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG5cbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuXG4gICAgaWYgKHRoaXMuaXNXZWJDb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5zdHlsZSA9IFN0eWxpemVyLnByb3RvdHlwZS5zdHJpbmdpZnkoc3R5bGUpO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJUZXh0ID0gdGhpcy5zdHlsZTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZS5hcHBlbmRDaGlsZChzdHlsZVRhZylcbiAgICAgICAgdGhpcy5jcmVhdGVDb21wb25lbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmxpbmVTdHlsZSA9IHRoaXMuc3R5bGVbJzpob3N0J10gfHwge307XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLnJlbmRlclRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50KCk7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gaW5saW5lU3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuc3R5bGVbYXR0cl0gPSBpbmxpbmVTdHlsZVthdHRyXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgdmFyIGVsO1xuXG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlLCBlbCk7XG5cbiAgICByZXR1cm4gZWw7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50cyh0ZW1wbGF0ZSwgYmFzZSkge1xuICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChpc1ZhbGlkVGFnKHRhZykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBjcmVhdGVPbmVFbGVtZW50LmNhbGwodGhpcywgdGFnKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNXZWJDb21wb25lbnQgJiYgdGhpcy5zdHlsZVt0YWddKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZElubGluZVN0eWxlKGVsLCB0aGlzLnN0eWxlW3RhZ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlW3RhZ10sIGVsKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnID09PSAncmVmJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmSW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRFdmVudHMuY2FsbCh0aGlzLCBiYXNlLCB0YWcsIHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKHBhcnNlZFsxXSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBwYXJzZWRbMl07XG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VkWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGVsLmlkID0gcGFyc2VkWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZElubGluZVN0eWxlKGVsLCBzdHlsZSkge1xuICAgICAgICBmb3IgKHZhciBhdHRyIGluIHN0eWxlKSB7XG4gICAgICAgICAgICBlbC5zdHlsZVthdHRyXSA9IHN0eWxlW2F0dHJdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkRXZlbnRzKGVsLCBvcmlnaW5FdnQsIG5ld0V2dCkge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKG9yaWdpbkV2dCwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKG5ld0V2dCwgdGhpcywgZSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gdGFnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVmFsaWRUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gKHRhZ1sxXSA9PT0gJyMnIHx8IHRhZ1sxXSA9PT0gJy4nKSAmJiB0YWcubGVuZ3RoID09PSAzO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIFJvb3QsIHJvb3Q7XG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIFxuXG4gICAgdHJ5IHtcbiAgICAgICAgUm9vdCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCh0aGlzLnRhZ05hbWUsIHtcbiAgICAgICAgICAgIHByb3RvdHlwZTogcHJvdG9cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWwgPSBuZXcgUm9vdCgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLnRhZ05hbWUpO1xuICAgIH1cblxuICAgIHRoaXMuZWwgPSBuZXcgUm9vdCgpXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZUNvbXBvbmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2aWV3ID0gdGhpcztcbiAgICB2YXIgUm9vdCwgcm9vdDtcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgXG4gICAgcHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzaGFkb3cgPSB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKHZpZXcudGVtcGxhdGUpO1xuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICAgICAgcHJvdG90eXBlOiBwcm90b1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG4gICAgfVxuXG5cbiAgICByZXR1cm4gdGhpcztcblxuICAgIGZ1bmN0aW9uIGlzUmVnaXN0ZWQgKG5hbWUpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpLmNvbnN0cnVjdG9yICE9PSBIVE1MRWxlbWVudDtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKCF0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgZWwuY2xhc3NOYW1lICs9IFwiIFwiICsgY2xhc3NOYW1lO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAodGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlZywnICcpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgcmV0dXJuICEhZWwuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKSk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWwucmVtb3ZlKCk7XG4gICAgdGhpcy5lbCA9IG51bGw7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMudW5zdWJzY3JpYmVBbGwoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiIsInZhciBMaW5rZWRMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB0aGlzLnRhaWwgPSBudWxsO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkVG9UYWlsID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgdGljayA9IHtcbiAgICAgICAgZnVuYzogZm4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhZCkge1xuICAgICAgICB0aGlzLmhlYWQgPSB0aWNrO1xuICAgICAgICB0aGlzLmhlYWQubmV4dCA9IHRoaXMudGFpbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YWlsKSB7XG4gICAgICAgIHRoaXMudGFpbC5uZXh0ID0gdGljaztcbiAgICB9XG4gICAgXG4gICAgdGhpcy50YWlsID0gdGljaztcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLnJlbW92ZUhlYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJldmlvdXNIZWFkO1xuXG4gICAgaWYgKHRoaXMuaGVhZCkge1xuICAgICAgICBwcmV2aW91c0hlYWQgPSB0aGlzLmhlYWQuZnVuYztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWFkLm5leHQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGhpcy5oZWFkLm5leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50YWlsID0gbnVsbDtcbiAgICAgICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlvdXNIZWFkO1xufTtcblxudmFyIFBFTkRJTkcgID0ge30sXG4gICAgUkVTT0xWRUQgPSB7fSxcbiAgICBSRUpFQ1RFRCA9IHt9OyBcblxudmFyIFZvdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2b3cgPSB7fTtcblxuICAgIHZhciBzdGF0dXMgICAgICAgPSBQRU5ESU5HO1xuICAgIHZhciByZXNvbHZlVGlja3MgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciByZWplY3RUaWNrcyAgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciBkb25lVGljaywgZXhjZXB0aW9uLCB2YWwsIGZuO1xuXG4gICAgdm93LnJlc29sdmUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVKRUNURUQgfHwgIXJlc29sdmVUaWNrcy5oZWFkKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlRG9uZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdHVzID0gUkVTT0xWRUQ7XG4gICAgICAgICAgICB2YWwgPSByZXQ7XG5cbiAgICAgICAgICAgIGZuID0gcmVzb2x2ZVRpY2tzLnJlbW92ZUhlYWQoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YWwgPSBmbi5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gUkVKRUNURUQ7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgICAgICB2b3cucmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm93LnJlc29sdmUodmFsKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICB9O1xuXG4gICAgdm93LnJlamVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVTT0xWRUQgfHwgIXJlamVjdFRpY2tzLmhlYWQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVEb25lKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0dXMgPSBSRUpFQ1RFRDtcbiAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG5cbiAgICAgICAgICAgIGZuID0gcmVqZWN0VGlja3MucmVtb3ZlSGVhZCgpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGVycjtcbiAgICAgICAgICAgICAgICB2b3cucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3cucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG5cbiAgICB9O1xuXG5cbiAgICB2b3cucHJvbWlzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB7fVxuXG4gICAgICAgIHByb21pc2UudGhlbiA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIHJlc29sdmVUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmNhdGNoID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVqZWN0VGlja3MuYWRkVG9UYWlsKGZ1bmMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJvbWlzZS5kb25lID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgZG9uZVRpY2sgPSBmdW5jO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuXG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2b3c7XG4gICAgXG4gICAgZnVuY3Rpb24gaGFuZGxlRG9uZSgpIHtcbiAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkb25lVGljaykge1xuICAgICAgICAgICAgZG9uZVRpY2suY2FsbCh0aGlzLCB2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVRpY2tzID0gbnVsbDtcbiAgICAgICAgcmVqZWN0VGlja3MgID0gbnVsbDtcbiAgICAgICAgZG9uZVRpY2sgICAgID0gbnVsbDtcbiAgICAgICAgZXhjZXB0aW9uICAgID0gbnVsbDtcbiAgICAgICAgdmFsICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgZm4gICAgICAgICAgID0gbnVsbDtcblxuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZvdztcblxuIiwid2luZG93LlRyaW8gPSByZXF1aXJlKCd0cmlvJyk7Il19
