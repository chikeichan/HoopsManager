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
            } else if (tag === 'textContent') {
                base.textContent = template[tag];
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2RlbC9tb2RlbC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvbW9kdWxlL21vZHVsZS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdm93L3Zvdy5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdjb250cm9sbGVyJyk7XG52YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLnZpZXdFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLnZpZXdFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLnZpZXcuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLm1vZGVsRXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5tb2RlbEV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMubW9kZWwuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlcjsiLCJ2YXIgRXZlbnRCdXMgPSBmdW5jdGlvbigpIHtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGlkID0gaWQ7XG4gICAgdmFyIGV2ZW50cyA9IHt9O1xuICAgIHJldHVybiAoZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgICB2YXIgZXZ0ID0ge31cbiAgICAgICAgZXZ0LnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll9zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQucHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3B1Ymxpc2goZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3Vuc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3Vuc3Vic2NyaWJlQWxsKGV2ZW50LCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXZ0O1xuICAgIH0pKHRoaXMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIGlmICghZXZlbnRzW2V2ZW50XSkge1xuICAgICAgICBldmVudHNbZXZlbnRdID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFldmVudHNbZXZlbnRdW2lkXSkge1xuICAgICAgICBldmVudHNbZXZlbnRdW2lkXSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIGV2ZW50c1tldmVudF1baWRdLnB1c2goZnVuYyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3B1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzLCBldmVudHMpIHtcbiAgICBjdHggPSBjdHggfHwgbnVsbDtcbiAgICBhcmdzID0gYXJncyB8fCBudWxsO1xuXG4gICAgdmFyIGV2ZW50QnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChldmVudEJ1Y2tldCkge1xuICAgICAgICBmb3IgKHZhciBidWNrZXQgaW4gZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgICAgIHZhciBjYlF1ZXVlID0gZXZlbnRCdWNrZXRbYnVja2V0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNiUXVldWUpKSB7XG4gICAgICAgICAgICAgICAgY2JRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGJ1Y2tldCkge1xuICAgICAgICB2YXIgcXVldWUgPSBidWNrZXRbaWRdO1xuXG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZm4sIGkpIHtcbiAgICAgICAgICAgIGlmKGZuID09PSBmdW5jKSB7XG4gICAgICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IFxuXG4gICAgZm9yICh2YXIgZXZ0IGluIGV2ZW50cykge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5zdWJzcmliZU9uZShldmVudCkge1xuICAgICAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgICAgICBpZiAoYnVja2V0ICYmIGJ1Y2tldFtpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBidWNrZXRbaWRdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1cztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIGNvdW50ID0gMTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkID0gc3RyICsgY291bnQ7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG59O1xuXG4iLCJ2YXIgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsL21vZGVsJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci9jb250cm9sbGVyJyk7XG52YXIgVmlldyA9IHJlcXVpcmUoJy4vdmlldy92aWV3Jyk7XG52YXIgU3R5bGl6ZXIgPSByZXF1aXJlKCcuL3N0eWxpemVyL3N0eWxpemVyJyk7XG52YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgTW9kdWxlID0gcmVxdWlyZSgnLi9tb2R1bGUvbW9kdWxlJyk7XG52YXIgVm93ID0gcmVxdWlyZSgnLi92b3cvdm93Jyk7XG5cbnZhciBnRXZlbnRCdXMgPSBuZXcgRXZlbnRCdXMoKTs7XG5cbnZhciBUcmlvID0ge1xuICAgIE1vZGVsOiBNb2RlbCxcbiAgICBDb250cm9sbGVyOiBDb250cm9sbGVyLFxuICAgIFZpZXc6IFZpZXcsXG4gICAgVm93OiBWb3csXG4gICAgU3R5bGl6ZXI6IG5ldyBTdHlsaXplcigpLFxuICAgIE1vZHVsZTogbmV3IE1vZHVsZSgpXG59XG5cbmZvciAodmFyIGtleSBpbiBUcmlvKSB7XG4gICAgVHJpb1trZXldLmV4dGVuZCA9IGV4dGVuZDtcbn1cblxuVHJpby5yZWdpc3Rlckdsb2JhbEV2ZW50QnVzID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gZ0V2ZW50QnVzLnJlZ2lzdGVyKGlkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJpbztcblxuZnVuY3Rpb24gZXh0ZW5kKG1ldGhvZHMpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fY29uc3RydWN0b3I7XG5cbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHN0YXRpY0F0dHIgPSB7fTtcbiAgICB2YXIgY2hpbGQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHN0YXRpY0F0dHIpIHtcbiAgICAgICAgICAgIHRoaXNba2V5XSA9IHN0YXRpY0F0dHJba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIFxuICAgIHZhciBleHRlbmRlZCA9IHt9O1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBwYXJlbnQucHJvdG90eXBlKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocGFyZW50LnByb3RvdHlwZSwgcHJvcCkpIHtcbiAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gcGFyZW50LnByb3RvdHlwZVtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIHByb3AgaW4gbWV0aG9kcykge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1ldGhvZHMsIHByb3ApKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0aWNBdHRyW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZXh0ZW5kZWQpO1xuXG4gICAgcmV0dXJuIGNoaWxkO1xufSIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ21vZGVsJyk7XG52YXIgTW9kZWwgPSB7fTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciBhdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cyA9IHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgICAgIHRoaXMuX3NldChrZXksIHZhbCwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldChrZXksIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXR0cmlidXRlcykpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0KF9kZWZhdWx0KHRoaXMuZGVmYXVsdHMsIG9wdHMpKTtcbiAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2luaXRpYWxpemUnLCB0aGlzLCBvcHRzKTtcblxuICAgIGZ1bmN0aW9uIF9kZWZhdWx0KGRlZiwgb3B0cykge1xuICAgICAgICBkZWYgPSBkZWYgfHwge31cbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdHMpIHtcbiAgICAgICAgICAgIGRlZltrZXldID0gb3B0c1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWY7XG4gICAgfVxufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwsIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICBmb3IgKHZhciBrIGluIGtleSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0KGssIGtleVtrXSwgYXR0cmlidXRlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYXR0cmlidXRlc1trZXldID0gdmFsO1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHJldFtrZXldID0gdmFsO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZScsIHRoaXMsIHJldCk7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlOicgKyBrZXksIHRoaXMsIHZhbCk7XG4gICAgfVxufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fZ2V0ID0gZnVuY3Rpb24oa2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzW2tleV07XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG52YXIgbW9kdWxlU3RvcmUgPSB7fTtcblxudmFyIE1vZHVsZSA9IGZ1bmN0aW9uKCkge1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICBkb25lKGZ1bmMoKSk7XG4gICAgfTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgIHZhciBsb2FkZWQgPSAwO1xuICAgIHZhciBjb3VudCAgPSBPYmplY3Qua2V5cyhtb2R1bGVzKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG4gICAgdmFyIHJldCA9IHt9O1xuICAgIHZhciB1cmw7XG5cbiAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcblxuICAgIHZvdy5wcm9taXNlLmFuZCA9IHt9O1xuICAgIHZvdy5wcm9taXNlLmFuZC5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgICAgICAgIHZvdy5wcm9taXNlXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jLmJpbmQodGhpcywgcmV0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgICAgICAgICAuZG9uZShkb25lKTtcbiAgICAgICAgfTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gdm93LnByb21pc2U7XG5cbiAgICBmdW5jdGlvbiBfaW1wb3J0KGtleSkge1xuICAgICAgICB2YXIgdXJsID0gbW9kdWxlc1trZXldO1xuXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVVJMIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtb2R1bGUgPSBtb2R1bGVTdG9yZVtrZXldO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFtb2R1bGUpIHtcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcblxuICAgICAgICAgICAgc2NyaXB0LnR5cGUgPSBcInRleHQvamF2YXNjcmlwdFwiO1xuICAgICAgICAgICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXIgPSBWb3coKTtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nICcgKyBrZXkgKyAnLi4uJyk7XG5cbiAgICAgICAgICAgICAgICBkZWZlci5wcm9taXNlLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXRba2V5XSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY291bnQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b3cucmVzb2x2ZShyZXQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ltcG9ydChjb3VudC5wb3AoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHNjcmlwdC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVTdG9yZVtrZXldKGRlZmVyLnJlc29sdmUpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMsIGtleSk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZvdy5yZXNvbHZlKG1vZHVsZSgpKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kdWxlO1xuIiwidmFyIG1peGlucyA9IHt9O1xudmFyIHZhcmlhYmxlcyA9IHt9O1xuXG52YXIgU3R5bGl6ZXIgPSBmdW5jdGlvbigpIHtcblxufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIHJldCA9ICcnO1xuXG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gc3R5bGUpIHtcbiAgICAgICAgcmV0ICs9IHNlbGVjdG9yICsgJ3snO1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IHN0eWxlW3NlbGVjdG9yXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZyA9IHByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICByZXQgKz0gcHJvcCArICc6JyArIHNldHRpbmcgKyAnOyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gcmV0LnNsaWNlKDAsIHJldC5sZW5ndGggLSAxKTtcbiAgICAgICAgcmV0ICs9ICd9JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnJlZ2lzdGVyTWl4aW5zID0gZnVuY3Rpb24oa2V5LCBmdW5jKSB7XG4gICAgbWl4aW5zW2tleV0gPSBmdW5jO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnJlZ2lzdGVyVmFyaWFibGVzID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICB2YXJpYWJsZXNba2V5XSA9IHZhbDtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5nZXRWYXJpYWJsZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICghdmFyaWFibGVzW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVmFyaWFibGUgJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHZhcmlhYmxlc1trZXldO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmdldE1peGlucyA9IGZ1bmN0aW9uKGtleSwgb3B0cykge1xuICAgIGlmICghbWl4aW5zW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTWl4aW4gJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIG1peGluc1trZXldLmNhbGwodGhpcywgb3B0cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxpemVyOyIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgU3R5bGl6ZXIgPSByZXF1aXJlKCcuLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCd2aWV3Jyk7XG52YXIgVmlldyA9IHt9O1xuXG5WaWV3Ll9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGUgfHwge307XG4gICAgdmFyIHN0eWxlID0gdGhpcy5zdHlsZSB8fCB7fTtcbiAgICB2YXIgc3R5bGVUYWcsIGlubGluZVN0eWxlO1xuXG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuXG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cyA9IHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cblxuICAgIGlmICh0aGlzLmlzV2ViQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuc3R5bGUgPSBTdHlsaXplci5wcm90b3R5cGUuc3RyaW5naWZ5KHN0eWxlKTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMucmVuZGVyVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgICAgICBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlVGFnLmlubmVyVGV4dCA9IHRoaXMuc3R5bGU7XG4gICAgICAgIHRoaXMudGVtcGxhdGUuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpXG4gICAgICAgIHRoaXMuY3JlYXRlQ29tcG9uZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5saW5lU3R5bGUgPSB0aGlzLnN0eWxlWyc6aG9zdCddIHx8IHt9O1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudCgpO1xuICAgICAgICBmb3IgKHZhciBhdHRyIGluIGlubGluZVN0eWxlKSB7XG4gICAgICAgICAgICB0aGlzLmVsLnN0eWxlW2F0dHJdID0gaW5saW5lU3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVuZGVyVGVtcGxhdGUgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgIHZhciBlbDtcblxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZSwgZWwpO1xuXG4gICAgcmV0dXJuIGVsO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudHModGVtcGxhdGUsIGJhc2UpIHtcbiAgICAgICAgZm9yICh2YXIgdGFnIGluIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZFRhZyh0YWcpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gY3JlYXRlT25lRWxlbWVudC5jYWxsKHRoaXMsIHRhZyk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzV2ViQ29tcG9uZW50ICYmIHRoaXMuc3R5bGVbdGFnXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRJbmxpbmVTdHlsZShlbCwgdGhpcy5zdHlsZVt0YWddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZVt0YWddLCBlbCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRhZyA9PT0gJ3JlZicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZkluZGV4W3RlbXBsYXRlW3RhZ11dID0gYmFzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnID09PSAndGV4dENvbnRlbnQnKSB7XG4gICAgICAgICAgICAgICAgYmFzZS50ZXh0Q29udGVudCA9IHRlbXBsYXRlW3RhZ107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50cy5jYWxsKHRoaXMsIGJhc2UsIHRhZywgdGVtcGxhdGVbdGFnXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVPbmVFbGVtZW50KHRhZykge1xuICAgICAgICB2YXIgcGFyc2VkID0gcGFyc2VUYWcodGFnKTtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSBwYXJzZWRbMF07XG5cbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcblxuICAgICAgICBpZiAocGFyc2VkWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHBhcnNlZFsyXTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZWRbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkSW5saW5lU3R5bGUoZWwsIHN0eWxlKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGVsLnN0eWxlW2F0dHJdID0gc3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFdmVudHMoZWwsIG9yaWdpbkV2dCwgbmV3RXZ0KSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIob3JpZ2luRXZ0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2gobmV3RXZ0LCB0aGlzLCBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiAodGFnWzFdID09PSAnIycgfHwgdGFnWzFdID09PSAnLicpICYmIHRhZy5sZW5ndGggPT09IDM7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgUm9vdCwgcm9vdDtcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgXG5cbiAgICB0cnkge1xuICAgICAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICAgICAgcHJvdG90eXBlOiBwcm90b1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMudGVtcGxhdGUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuY3JlYXRlQ29tcG9uZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZpZXcgPSB0aGlzO1xuICAgIHZhciBSb290LCByb290O1xuICAgIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBcbiAgICBwcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNoYWRvdyA9IHRoaXMuY3JlYXRlU2hhZG93Um9vdCgpO1xuICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQodmlldy50ZW1wbGF0ZSk7XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIFJvb3QgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGhpcy50YWdOYW1lLCB7XG4gICAgICAgICAgICBwcm90b3R5cGU6IHByb3RvXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVsID0gbmV3IFJvb3QoKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy50YWdOYW1lKTtcbiAgICB9XG5cblxuICAgIHJldHVybiB0aGlzO1xuXG4gICAgZnVuY3Rpb24gaXNSZWdpc3RlZCAobmFtZSkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSkuY29uc3RydWN0b3IgIT09IEhUTUxFbGVtZW50O1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAoIXRoaXMuaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICBlbC5jbGFzc05hbWUgKz0gXCIgXCIgKyBjbGFzc05hbWU7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICAgIGlmICh0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmVnLCcgJyk7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICByZXR1cm4gISFlbC5jbGFzc05hbWUubWF0Y2gobmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbGFzc05hbWUrJyhcXFxcc3wkKScpKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsID0gbnVsbDtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG4gICAgdGhpcy5ldmVudEJ1cy51bnN1YnNjcmliZUFsbCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIiwidmFyIExpbmtlZExpc3QgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhlYWQgPSBudWxsO1xuICAgIHRoaXMudGFpbCA9IG51bGw7XG59O1xuXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5hZGRUb1RhaWwgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciB0aWNrID0ge1xuICAgICAgICBmdW5jOiBmbixcbiAgICAgICAgbmV4dDogbnVsbFxuICAgIH1cblxuICAgIGlmICghdGhpcy5oZWFkKSB7XG4gICAgICAgIHRoaXMuaGVhZCA9IHRpY2s7XG4gICAgICAgIHRoaXMuaGVhZC5uZXh0ID0gdGhpcy50YWlsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRhaWwpIHtcbiAgICAgICAgdGhpcy50YWlsLm5leHQgPSB0aWNrO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLnRhaWwgPSB0aWNrO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUucmVtb3ZlSGVhZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcmV2aW91c0hlYWQ7XG5cbiAgICBpZiAodGhpcy5oZWFkKSB7XG4gICAgICAgIHByZXZpb3VzSGVhZCA9IHRoaXMuaGVhZC5mdW5jO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlYWQubmV4dCkge1xuICAgICAgICB0aGlzLmhlYWQgPSB0aGlzLmhlYWQubmV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRhaWwgPSBudWxsO1xuICAgICAgICB0aGlzLmhlYWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBwcmV2aW91c0hlYWQ7XG59O1xuXG52YXIgUEVORElORyAgPSB7fSxcbiAgICBSRVNPTFZFRCA9IHt9LFxuICAgIFJFSkVDVEVEID0ge307IFxuXG52YXIgVm93ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZvdyA9IHt9O1xuXG4gICAgdmFyIHN0YXR1cyAgICAgICA9IFBFTkRJTkc7XG4gICAgdmFyIHJlc29sdmVUaWNrcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG4gICAgdmFyIHJlamVjdFRpY2tzICA9IG5ldyBMaW5rZWRMaXN0KCk7XG4gICAgdmFyIGRvbmVUaWNrLCBleGNlcHRpb24sIHZhbCwgZm47XG5cbiAgICB2b3cucmVzb2x2ZSA9IGZ1bmN0aW9uKHJldCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSRUpFQ1RFRCB8fCAhcmVzb2x2ZVRpY2tzLmhlYWQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVEb25lKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0dXMgPSBSRVNPTFZFRDtcbiAgICAgICAgICAgIHZhbCA9IHJldDtcblxuICAgICAgICAgICAgZm4gPSByZXNvbHZlVGlja3MucmVtb3ZlSGVhZCgpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhbCA9IGZuLmNhbGwodGhpcywgcmV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBSRUpFQ1RFRDtcbiAgICAgICAgICAgICAgICBleGNlcHRpb24gPSBlO1xuICAgICAgICAgICAgICAgIHZvdy5yZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3cucmVzb2x2ZSh2YWwpO1xuICAgICAgICB9LmJpbmQodGhpcyksIDApO1xuICAgIH07XG5cbiAgICB2b3cucmVqZWN0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSRVNPTFZFRCB8fCAhcmVqZWN0VGlja3MuaGVhZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcblxuICAgICAgICAgICAgZm4gPSByZWplY3RUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZXJyO1xuICAgICAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcblxuICAgIH07XG5cblxuICAgIHZvdy5wcm9taXNlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHt9XG5cbiAgICAgICAgcHJvbWlzZS50aGVuID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVzb2x2ZVRpY2tzLmFkZFRvVGFpbChmdW5jKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByb21pc2UuY2F0Y2ggPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICByZWplY3RUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmRvbmUgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICBkb25lVGljayA9IGZ1bmM7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZvdztcbiAgICBcbiAgICBmdW5jdGlvbiBoYW5kbGVEb25lKCkge1xuICAgICAgICBpZiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRvbmVUaWNrKSB7XG4gICAgICAgICAgICBkb25lVGljay5jYWxsKHRoaXMsIHZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlVGlja3MgPSBudWxsO1xuICAgICAgICByZWplY3RUaWNrcyAgPSBudWxsO1xuICAgICAgICBkb25lVGljayAgICAgPSBudWxsO1xuICAgICAgICBleGNlcHRpb24gICAgPSBudWxsO1xuICAgICAgICB2YWwgICAgICAgICAgPSBudWxsO1xuICAgICAgICBmbiAgICAgICAgICAgPSBudWxsO1xuXG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVm93O1xuXG4iLCJ3aW5kb3cuVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTsiXX0=
