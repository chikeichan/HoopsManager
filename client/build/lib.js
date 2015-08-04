(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var IdGenerator = require('../helpers/IdGenerator')('controller');
var extend = require('../helpers/extend');

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

Controller.extend = extend;

module.exports = Controller;
},{"../helpers/IdGenerator":4,"../helpers/extend":7}],2:[function(require,module,exports){
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
var EventBus = require('../eventBus/eventBus');
var IdGenerator = require('../helpers/IdGenerator')('factory');
var extend = require('../helpers/extend');
var defaults = require('../helpers/defaults');

var Factory = {};

Factory._constructor = function(opts) {
    this._initialize(opts);
};

Factory._constructor.prototype._initialize = function(opts) {
    var attributes = {};

    opts = opts || {};

    this.id = IdGenerator();
    this.resources = {};
    this.eventBus = opts.eventBus || new EventBus();
    this.eventBus = this.eventBus.register(this.id);

    this.set = function(key, val) {
        this._set(key, val, attributes);
    }

    this.unset = function(key) {
        this._unset(key, attributes);
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

    this.set(defaults(opts, this.defaults));
    this.eventBus.publish('initialize', this, opts);
};

Factory._constructor.prototype._set = function(key, val, attributes) {
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

Factory._constructor.prototype._get = function(key, attributes) {
    if (typeof key === 'string') {
        return attributes[key];
    }  else if (typeof key === 'undefined') {
        return attributes;
    }
};

Factory._constructor.prototype._unset = function(key, attributes) {
    if (typeof key === 'string') {
        var ret = {};
        ret[key] = attributes[key];
        delete attributes[key];
        this.eventBus.publish('delete', this, ret);
        this.eventBus.publish('delete:' + key, this, ret[key]);
    } else if (typeof key === 'undefined') {
        for (var k in attributes) {
            this._unset(k);
        }
    }
};

Factory._constructor.prototype.sync = function(resource, id) {
    this.resources[resource] = resource;

    resource.eventBus.subscribe('change:' + id, function(ctx, attrs) {
        for (var k in attrs) {
            this.set(k, attrs[k]);
        }
    }.bind(this));

    resource.eventBus.subscribe('delete:' + id, function(ctx, attrs) {
        this.unset();
    }.bind(this))
};

Factory.extend = extend;

module.exports = Factory;

},{"../eventBus/eventBus":2,"../helpers/IdGenerator":4,"../helpers/defaults":6,"../helpers/extend":7}],4:[function(require,module,exports){
module.exports = function(str) {
    var count = 1;

    return function() {
        var id = str + count;
        count++;
        return id;
    }
};


},{}],5:[function(require,module,exports){
var Vow = require('../vow/vow');

module.exports = function (opts) {
    var xhr = new XMLHttpRequest();
    var vow = Vow();

    if (opts.encode) {
        opts.url += encodeURI(opts.encode(opts.payload));
    }

    xhr.open(opts.type.toUpperCase(), opts.url);
    xhr.setRequestHeader('Content-Type', opts.contentType);

    for (var header in opts.headers) {
        xhr.setRequestHeader(header, opts.headers[header]);
    }

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status <= 299) {
            vow.resolve(xhr.responseText);
        } else {
            vow.reject(xhr.responseText);
        }
    }

    if (opts.encode) {
        xhr.send();
    } else {
        xhr.send(JSON.stringify(opts.payload));
    }

    return vow.promise;
};
},{"../vow/vow":14}],6:[function(require,module,exports){
module.exports = function (obj, defaults) {
    defaults = defaults || {};
    
    for (var key in defaults) {
        if (!obj[key]) {
            obj[key] = defaults[key];
        }
    }

    return obj;
}
},{}],7:[function(require,module,exports){
module.exports = function (methods) {
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

},{}],8:[function(require,module,exports){
module.exports = function (object) {
    var encodedString = '';
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (encodedString.length > 0) {
                encodedString += '&';
            }
            encodedString += encodeURI(prop + '=' + object[prop]);
        }
    }
    return encodedString;
}
},{}],9:[function(require,module,exports){
var Factory = require('./factory/factory');
var Controller = require('./controller/controller');
var View = require('./view/view');
var Stylizer = require('./stylizer/stylizer');
var EventBus = require('./eventBus/eventBus');
var Module = require('./module/module');
var Resource = require('./resource/resource');
var Vow = require('./vow/vow');

var gEventBus = new EventBus();;

var Trio = {
    Factory: Factory,
    Controller: Controller,
    View: View,
    Vow: Vow,
    Stylizer: new Stylizer(),
    Module: new Module(),
    Resource: new Resource()
}

Trio.registerGlobalEventBus = function(id) {
    return gEventBus.register(id);
};

module.exports = Trio;

},{"./controller/controller":1,"./eventBus/eventBus":2,"./factory/factory":3,"./module/module":10,"./resource/resource":11,"./stylizer/stylizer":12,"./view/view":13,"./vow/vow":14}],10:[function(require,module,exports){
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

    vow.promise.and.import = function(modules) {
        return vow.promise.then(this.import.bind(this, modules));
    }.bind(this)

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

},{"../vow/vow":14}],11:[function(require,module,exports){
var Vow = require('../vow/vow');
var Factory = require('../factory/factory');
var ajax = require('../helpers/ajax');
var param = require('../helpers/param');
var methods = ['read', 'create', 'update', 'delete'];
var Data = Factory.extend({
    ajax: function(opts){
        if (!opts.url) throw new Error('Url is required.');
        if (!opts.type) throw new Error('Request type is required.');

        opts.contentType = opts.contentType || 'application/json';
        opts.encode      = opts.encode || null;
        opts.payload     = opts.payload || null;
        opts.indexBy     = opts.indexBy || 'id';

        return ajax(opts)
                .then(_parse.bind(this))
                .then(_updateStore.bind(this));

        function _updateStore(rsp) {
            if (opts.type.toUpperCase() === 'DELETE') {
                if (Array.isArray(rsp)) {
                    rsp.forEach(function(d) {
                        this.unset(d[opts.indexBy], d);
                    }.bind(this));
                } else if (typeof rsp === 'object') {
                    this.unset(rsp[opts.indexBy], rsp);
                }
            } else {
                if (Array.isArray(rsp)) {
                    rsp.forEach(function(d) {
                        this.set(d[opts.indexBy], d);
                    }.bind(this));
                } else if (typeof rsp === 'object') {
                    this.set(rsp[opts.indexBy], rsp);
                }
            }
            return rsp;
        }

        function _parse(rsp) {
            if (opts.parse) {
                return opts.parse(rsp);
            } 
            return this.parse(rsp);
        }
    },

    parse: function(rsp) {
        return JSON.parse(rsp);
    }
});

var datastore = {};
var Resource = function() {
};

Resource.prototype.register = function(name) {
    if (datastore[name]) {
        throw new Error('Resource ' + name + ' already exist.');
    }

    datastore[name] = new Data();
    return datastore[name];
};

Resource.prototype.get = function(name) {
    return datastore[name] ? datastore[name] : this.register(name);
}

module.exports = Resource;

},{"../factory/factory":3,"../helpers/ajax":5,"../helpers/param":8,"../vow/vow":14}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
var EventBus = require('../eventBus/eventBus');
var Stylizer = require('../stylizer/stylizer');
var IdGenerator = require('../helpers/IdGenerator')('view');
var extend = require('../helpers/extend');

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

View.extend = extend;

module.exports = View;

},{"../eventBus/eventBus":2,"../helpers/IdGenerator":4,"../helpers/extend":7,"../stylizer/stylizer":12}],14:[function(require,module,exports){
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
            
            if (val && typeof val.then === 'function') {
                val.then(vow.resolve);
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


},{}],15:[function(require,module,exports){
window.Trio = require('trio');
},{"trio":9}]},{},[15])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2ZhY3RvcnkvZmFjdG9yeS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9JZEdlbmVyYXRvci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9hamF4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9oZWxwZXJzL2RlZmF1bHRzLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9oZWxwZXJzL2V4dGVuZC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9wYXJhbS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaW5kZXguanMiLCIuLi9UcmluaXR5SlMvc3JjL21vZHVsZS9tb2R1bGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL3Jlc291cmNlL3Jlc291cmNlLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9zdHlsaXplci9zdHlsaXplci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdmlldy92aWV3LmpzIiwiLi4vVHJpbml0eUpTL3NyYy92b3cvdm93LmpzIiwiY2xpZW50L3NyYy9saWIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2NvbnRyb2xsZXInKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2V4dGVuZCcpO1xuXG52YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLnZpZXdFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLnZpZXdFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLnZpZXcuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLm1vZGVsRXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5tb2RlbEV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMubW9kZWwuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cbkNvbnRyb2xsZXIuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7IiwidmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBpZCA9IGlkO1xuICAgIHZhciBldmVudHMgPSB7fTtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGV2dCA9IHt9XG4gICAgICAgIGV2dC5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICAgICAgY29udGV4dC5fc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnB1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll9wdWJsaXNoKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll91bnN1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC51bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBjb250ZXh0Ll91bnN1YnNjcmliZUFsbChldmVudCwgaWQsIGV2ZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV2dDtcbiAgICB9KSh0aGlzKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoIWV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XSA9IHt9O1xuICAgIH1cblxuICAgIGlmICghZXZlbnRzW2V2ZW50XVtpZF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XVtpZF0gPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGNhbGxiYWNrIGZ1bmN0aW9uIG11c3QgYmUgcGFzc2VkIGluIHRvIHN1YnNjcmliZScpO1xuICAgIH1cbiAgICBcbiAgICBldmVudHNbZXZlbnRdW2lkXS5wdXNoKGZ1bmMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKSB7XG4gICAgY3R4ID0gY3R4IHx8IG51bGw7XG4gICAgYXJncyA9IGFyZ3MgfHwgbnVsbDtcblxuICAgIHZhciBldmVudEJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgZm9yICh2YXIgYnVja2V0IGluIGV2ZW50QnVja2V0KSB7XG4gICAgICAgICAgICB2YXIgY2JRdWV1ZSA9IGV2ZW50QnVja2V0W2J1Y2tldF07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYlF1ZXVlKSkge1xuICAgICAgICAgICAgICAgIGNiUXVldWUuZm9yRWFjaChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgICAgICAgICBjYi5jYWxsKHRoaXMsIGN0eCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChidWNrZXQpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gYnVja2V0W2lkXTtcblxuICAgICAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGZuLCBpKSB7XG4gICAgICAgICAgICBpZihmbiA9PT0gZnVuYykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50LCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgfSBcblxuICAgIGZvciAodmFyIGV2dCBpbiBldmVudHMpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuc3Vic3JpYmVPbmUoZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICAgICAgaWYgKGJ1Y2tldCAmJiBidWNrZXRbaWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgYnVja2V0W2lkXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRCdXM7XG4iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdmYWN0b3J5Jyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi4vaGVscGVycy9leHRlbmQnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZGVmYXVsdHMnKTtcblxudmFyIEZhY3RvcnkgPSB7fTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlc291cmNlcyA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICB0aGlzLl9zZXQoa2V5LCB2YWwsIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMudW5zZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdGhpcy5fdW5zZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KGtleSwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhdHRyaWJ1dGVzKSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQoZGVmYXVsdHMob3B0cywgdGhpcy5kZWZhdWx0cykpO1xuICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnaW5pdGlhbGl6ZScsIHRoaXMsIG9wdHMpO1xufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLl9zZXQgPSBmdW5jdGlvbihrZXksIHZhbCwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLl9zZXQoaywga2V5W2tdLCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWw7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlJywgdGhpcywgcmV0KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2U6JyArIGtleSwgdGhpcywgdmFsKTtcbiAgICB9XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2dldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gYXR0cmlidXRlc1trZXldO1xuICAgIH0gIGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgIH1cbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fdW5zZXQgPSBmdW5jdGlvbihrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgZGVsZXRlIGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdkZWxldGUnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2RlbGV0ZTonICsga2V5LCB0aGlzLCByZXRba2V5XSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IgKHZhciBrIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Vuc2V0KGspO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbihyZXNvdXJjZSwgaWQpIHtcbiAgICB0aGlzLnJlc291cmNlc1tyZXNvdXJjZV0gPSByZXNvdXJjZTtcblxuICAgIHJlc291cmNlLmV2ZW50QnVzLnN1YnNjcmliZSgnY2hhbmdlOicgKyBpZCwgZnVuY3Rpb24oY3R4LCBhdHRycykge1xuICAgICAgICBmb3IgKHZhciBrIGluIGF0dHJzKSB7XG4gICAgICAgICAgICB0aGlzLnNldChrLCBhdHRyc1trXSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgcmVzb3VyY2UuZXZlbnRCdXMuc3Vic2NyaWJlKCdkZWxldGU6JyArIGlkLCBmdW5jdGlvbihjdHgsIGF0dHJzKSB7XG4gICAgICAgIHRoaXMudW5zZXQoKTtcbiAgICB9LmJpbmQodGhpcykpXG59O1xuXG5GYWN0b3J5LmV4dGVuZCA9IGV4dGVuZDtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWN0b3J5O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgY291bnQgPSAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBzdHIgKyBjb3VudDtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbn07XG5cbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgdmFyIHZvdyA9IFZvdygpO1xuXG4gICAgaWYgKG9wdHMuZW5jb2RlKSB7XG4gICAgICAgIG9wdHMudXJsICs9IGVuY29kZVVSSShvcHRzLmVuY29kZShvcHRzLnBheWxvYWQpKTtcbiAgICB9XG5cbiAgICB4aHIub3BlbihvcHRzLnR5cGUudG9VcHBlckNhc2UoKSwgb3B0cy51cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBvcHRzLmNvbnRlbnRUeXBlKTtcblxuICAgIGZvciAodmFyIGhlYWRlciBpbiBvcHRzLmhlYWRlcnMpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCBvcHRzLmhlYWRlcnNbaGVhZGVyXSk7XG4gICAgfVxuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8PSAyOTkpIHtcbiAgICAgICAgICAgIHZvdy5yZXNvbHZlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm93LnJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLmVuY29kZSkge1xuICAgICAgICB4aHIuc2VuZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KG9wdHMucGF5bG9hZCkpO1xuICAgIH1cblxuICAgIHJldHVybiB2b3cucHJvbWlzZTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBkZWZhdWx0cykge1xuICAgIGRlZmF1bHRzID0gZGVmYXVsdHMgfHwge307XG4gICAgXG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRzKSB7XG4gICAgICAgIGlmICghb2JqW2tleV0pIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcblxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIgZW5jb2RlZFN0cmluZyA9ICcnO1xuICAgIGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgIGlmIChlbmNvZGVkU3RyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBlbmNvZGVkU3RyaW5nICs9ICcmJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuY29kZWRTdHJpbmcgKz0gZW5jb2RlVVJJKHByb3AgKyAnPScgKyBvYmplY3RbcHJvcF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVkU3RyaW5nO1xufSIsInZhciBGYWN0b3J5ID0gcmVxdWlyZSgnLi9mYWN0b3J5L2ZhY3RvcnknKTtcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2NvbnRyb2xsZXInKTtcbnZhciBWaWV3ID0gcmVxdWlyZSgnLi92aWV3L3ZpZXcnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4vc3R5bGl6ZXIvc3R5bGl6ZXInKTtcbnZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBNb2R1bGUgPSByZXF1aXJlKCcuL21vZHVsZS9tb2R1bGUnKTtcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoJy4vcmVzb3VyY2UvcmVzb3VyY2UnKTtcbnZhciBWb3cgPSByZXF1aXJlKCcuL3Zvdy92b3cnKTtcblxudmFyIGdFdmVudEJ1cyA9IG5ldyBFdmVudEJ1cygpOztcblxudmFyIFRyaW8gPSB7XG4gICAgRmFjdG9yeTogRmFjdG9yeSxcbiAgICBDb250cm9sbGVyOiBDb250cm9sbGVyLFxuICAgIFZpZXc6IFZpZXcsXG4gICAgVm93OiBWb3csXG4gICAgU3R5bGl6ZXI6IG5ldyBTdHlsaXplcigpLFxuICAgIE1vZHVsZTogbmV3IE1vZHVsZSgpLFxuICAgIFJlc291cmNlOiBuZXcgUmVzb3VyY2UoKVxufVxuXG5UcmlvLnJlZ2lzdGVyR2xvYmFsRXZlbnRCdXMgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiBnRXZlbnRCdXMucmVnaXN0ZXIoaWQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmlvO1xuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcbnZhciBtb2R1bGVTdG9yZSA9IHt9O1xuXG52YXIgTW9kdWxlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgIGRvbmUoZnVuYygpKTtcbiAgICB9O1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihtb2R1bGVzKSB7XG4gICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgdmFyIGNvdW50ICA9IE9iamVjdC5rZXlzKG1vZHVsZXMpO1xuICAgIHZhciB2b3cgPSBWb3coKTtcbiAgICB2YXIgcmV0ID0ge307XG4gICAgdmFyIHVybDtcblxuICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuXG4gICAgdm93LnByb21pc2UuYW5kID0ge307XG4gICAgdm93LnByb21pc2UuYW5kLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgICAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICAgICAgdm93LnByb21pc2VcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmMuYmluZCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgIC5kb25lKGRvbmUpO1xuICAgICAgICB9O1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHZvdy5wcm9taXNlLmFuZC5pbXBvcnQgPSBmdW5jdGlvbihtb2R1bGVzKSB7XG4gICAgICAgIHJldHVybiB2b3cucHJvbWlzZS50aGVuKHRoaXMuaW1wb3J0LmJpbmQodGhpcywgbW9kdWxlcykpO1xuICAgIH0uYmluZCh0aGlzKVxuXG4gICAgcmV0dXJuIHZvdy5wcm9taXNlO1xuXG4gICAgZnVuY3Rpb24gX2ltcG9ydChrZXkpIHtcbiAgICAgICAgdmFyIHVybCA9IG1vZHVsZXNba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIG5hbWUgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB1cmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VSTCBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbW9kdWxlID0gbW9kdWxlU3RvcmVba2V5XTtcbiAgICAgICAgXG4gICAgICAgIGlmICghbW9kdWxlKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgICAgICAgICAgIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICAgICAgICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgICAgICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVyID0gVm93KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTG9hZGluZyAnICsga2V5ICsgJy4uLicpO1xuXG4gICAgICAgICAgICAgICAgZGVmZXIucHJvbWlzZS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0W2tleV0gPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICBsb2FkZWQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm93LnJlc29sdmUocmV0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBzY3JpcHQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlU3RvcmVba2V5XShkZWZlci5yZXNvbHZlKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzLCBrZXkpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2b3cucmVzb2x2ZShtb2R1bGUoKSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTtcbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG52YXIgRmFjdG9yeSA9IHJlcXVpcmUoJy4uL2ZhY3RvcnkvZmFjdG9yeScpO1xudmFyIGFqYXggPSByZXF1aXJlKCcuLi9oZWxwZXJzL2FqYXgnKTtcbnZhciBwYXJhbSA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvcGFyYW0nKTtcbnZhciBtZXRob2RzID0gWydyZWFkJywgJ2NyZWF0ZScsICd1cGRhdGUnLCAnZGVsZXRlJ107XG52YXIgRGF0YSA9IEZhY3RvcnkuZXh0ZW5kKHtcbiAgICBhamF4OiBmdW5jdGlvbihvcHRzKXtcbiAgICAgICAgaWYgKCFvcHRzLnVybCkgdGhyb3cgbmV3IEVycm9yKCdVcmwgaXMgcmVxdWlyZWQuJyk7XG4gICAgICAgIGlmICghb3B0cy50eXBlKSB0aHJvdyBuZXcgRXJyb3IoJ1JlcXVlc3QgdHlwZSBpcyByZXF1aXJlZC4nKTtcblxuICAgICAgICBvcHRzLmNvbnRlbnRUeXBlID0gb3B0cy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgIG9wdHMuZW5jb2RlICAgICAgPSBvcHRzLmVuY29kZSB8fCBudWxsO1xuICAgICAgICBvcHRzLnBheWxvYWQgICAgID0gb3B0cy5wYXlsb2FkIHx8IG51bGw7XG4gICAgICAgIG9wdHMuaW5kZXhCeSAgICAgPSBvcHRzLmluZGV4QnkgfHwgJ2lkJztcblxuICAgICAgICByZXR1cm4gYWpheChvcHRzKVxuICAgICAgICAgICAgICAgIC50aGVuKF9wYXJzZS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgIC50aGVuKF91cGRhdGVTdG9yZS5iaW5kKHRoaXMpKTtcblxuICAgICAgICBmdW5jdGlvbiBfdXBkYXRlU3RvcmUocnNwKSB7XG4gICAgICAgICAgICBpZiAob3B0cy50eXBlLnRvVXBwZXJDYXNlKCkgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocnNwKSkge1xuICAgICAgICAgICAgICAgICAgICByc3AuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVuc2V0KGRbb3B0cy5pbmRleEJ5XSwgZCk7XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnNwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVuc2V0KHJzcFtvcHRzLmluZGV4QnldLCByc3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocnNwKSkge1xuICAgICAgICAgICAgICAgICAgICByc3AuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChkW29wdHMuaW5kZXhCeV0sIGQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJzcCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQocnNwW29wdHMuaW5kZXhCeV0sIHJzcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJzcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9wYXJzZShyc3ApIHtcbiAgICAgICAgICAgIGlmIChvcHRzLnBhcnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMucGFyc2UocnNwKTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZShyc3ApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHBhcnNlOiBmdW5jdGlvbihyc3ApIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocnNwKTtcbiAgICB9XG59KTtcblxudmFyIGRhdGFzdG9yZSA9IHt9O1xudmFyIFJlc291cmNlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5SZXNvdXJjZS5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKGRhdGFzdG9yZVtuYW1lXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc291cmNlICcgKyBuYW1lICsgJyBhbHJlYWR5IGV4aXN0LicpO1xuICAgIH1cblxuICAgIGRhdGFzdG9yZVtuYW1lXSA9IG5ldyBEYXRhKCk7XG4gICAgcmV0dXJuIGRhdGFzdG9yZVtuYW1lXTtcbn07XG5cblJlc291cmNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGRhdGFzdG9yZVtuYW1lXSA/IGRhdGFzdG9yZVtuYW1lXSA6IHRoaXMucmVnaXN0ZXIobmFtZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2U7XG4iLCJ2YXIgbWl4aW5zID0ge307XG52YXIgdmFyaWFibGVzID0ge307XG5cbnZhciBTdHlsaXplciA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgICB2YXIgcmV0ID0gJyc7XG5cbiAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBzdHlsZSkge1xuICAgICAgICByZXQgKz0gc2VsZWN0b3IgKyAneyc7XG4gICAgICAgIHZhciBwcm9wZXJ0aWVzID0gc3R5bGVbc2VsZWN0b3JdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5nID0gcHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgIHJldCArPSBwcm9wICsgJzonICsgc2V0dGluZyArICc7JztcbiAgICAgICAgfVxuICAgICAgICByZXQgPSByZXQuc2xpY2UoMCwgcmV0Lmxlbmd0aCAtIDEpO1xuICAgICAgICByZXQgKz0gJ30nO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUucmVnaXN0ZXJNaXhpbnMgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBtaXhpbnNba2V5XSA9IGZ1bmM7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUucmVnaXN0ZXJWYXJpYWJsZXMgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgIHZhcmlhYmxlc1trZXldID0gdmFsO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmdldFZhcmlhYmxlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCF2YXJpYWJsZXNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdWYXJpYWJsZSAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdmFyaWFibGVzW2tleV07XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuZ2V0TWl4aW5zID0gZnVuY3Rpb24oa2V5LCBvcHRzKSB7XG4gICAgaWYgKCFtaXhpbnNba2V5XSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNaXhpbiAnICsga2V5ICsgJyBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbWl4aW5zW2tleV0uY2FsbCh0aGlzLCBvcHRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGl6ZXI7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4uL3N0eWxpemVyL3N0eWxpemVyJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ3ZpZXcnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2V4dGVuZCcpO1xuXG52YXIgVmlldyA9IHt9O1xuXG5WaWV3Ll9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGUgfHwge307XG4gICAgdmFyIHN0eWxlID0gdGhpcy5zdHlsZSB8fCB7fTtcbiAgICB2YXIgc3R5bGVUYWcsIGlubGluZVN0eWxlO1xuXG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuXG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cyA9IHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cblxuICAgIGlmICh0aGlzLmlzV2ViQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuc3R5bGUgPSBTdHlsaXplci5wcm90b3R5cGUuc3RyaW5naWZ5KHN0eWxlKTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMucmVuZGVyVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgICAgICBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlVGFnLmlubmVyVGV4dCA9IHRoaXMuc3R5bGU7XG4gICAgICAgIHRoaXMudGVtcGxhdGUuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpXG4gICAgICAgIHRoaXMuY3JlYXRlQ29tcG9uZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5saW5lU3R5bGUgPSB0aGlzLnN0eWxlWyc6aG9zdCddIHx8IHt9O1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudCgpO1xuICAgICAgICBmb3IgKHZhciBhdHRyIGluIGlubGluZVN0eWxlKSB7XG4gICAgICAgICAgICB0aGlzLmVsLnN0eWxlW2F0dHJdID0gaW5saW5lU3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVuZGVyVGVtcGxhdGUgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgIHZhciBlbDtcblxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZSwgZWwpO1xuXG4gICAgcmV0dXJuIGVsO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudHModGVtcGxhdGUsIGJhc2UpIHtcbiAgICAgICAgZm9yICh2YXIgdGFnIGluIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoaXNWYWxpZFRhZyh0YWcpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gY3JlYXRlT25lRWxlbWVudC5jYWxsKHRoaXMsIHRhZyk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzV2ViQ29tcG9uZW50ICYmIHRoaXMuc3R5bGVbdGFnXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRJbmxpbmVTdHlsZShlbCwgdGhpcy5zdHlsZVt0YWddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgY3JlYXRlRWxlbWVudHMuY2FsbCh0aGlzLCB0ZW1wbGF0ZVt0YWddLCBlbCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRhZyA9PT0gJ3JlZicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZkluZGV4W3RlbXBsYXRlW3RhZ11dID0gYmFzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnID09PSAndGV4dENvbnRlbnQnKSB7XG4gICAgICAgICAgICAgICAgYmFzZS50ZXh0Q29udGVudCA9IHRlbXBsYXRlW3RhZ107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50cy5jYWxsKHRoaXMsIGJhc2UsIHRhZywgdGVtcGxhdGVbdGFnXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVPbmVFbGVtZW50KHRhZykge1xuICAgICAgICB2YXIgcGFyc2VkID0gcGFyc2VUYWcodGFnKTtcbiAgICAgICAgdmFyIHRhZ05hbWUgPSBwYXJzZWRbMF07XG5cbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcblxuICAgICAgICBpZiAocGFyc2VkWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHBhcnNlZFsyXTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZWRbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkSW5saW5lU3R5bGUoZWwsIHN0eWxlKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGVsLnN0eWxlW2F0dHJdID0gc3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFdmVudHMoZWwsIG9yaWdpbkV2dCwgbmV3RXZ0KSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIob3JpZ2luRXZ0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2gobmV3RXZ0LCB0aGlzLCBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiAodGFnWzFdID09PSAnIycgfHwgdGFnWzFdID09PSAnLicpICYmIHRhZy5sZW5ndGggPT09IDM7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgUm9vdCwgcm9vdDtcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgXG5cbiAgICB0cnkge1xuICAgICAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICAgICAgcHJvdG90eXBlOiBwcm90b1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMudGVtcGxhdGUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuY3JlYXRlQ29tcG9uZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZpZXcgPSB0aGlzO1xuICAgIHZhciBSb290LCByb290O1xuICAgIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBcbiAgICBwcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNoYWRvdyA9IHRoaXMuY3JlYXRlU2hhZG93Um9vdCgpO1xuICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQodmlldy50ZW1wbGF0ZSk7XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAgIFJvb3QgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGhpcy50YWdOYW1lLCB7XG4gICAgICAgICAgICBwcm90b3R5cGU6IHByb3RvXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVsID0gbmV3IFJvb3QoKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy50YWdOYW1lKTtcbiAgICB9XG5cblxuICAgIHJldHVybiB0aGlzO1xuXG4gICAgZnVuY3Rpb24gaXNSZWdpc3RlZCAobmFtZSkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSkuY29uc3RydWN0b3IgIT09IEhUTUxFbGVtZW50O1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAoIXRoaXMuaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICBlbC5jbGFzc05hbWUgKz0gXCIgXCIgKyBjbGFzc05hbWU7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICAgIGlmICh0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmVnLCcgJyk7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICByZXR1cm4gISFlbC5jbGFzc05hbWUubWF0Y2gobmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbGFzc05hbWUrJyhcXFxcc3wkKScpKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsID0gbnVsbDtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG4gICAgdGhpcy5ldmVudEJ1cy51bnN1YnNjcmliZUFsbCgpO1xufTtcblxuVmlldy5leHRlbmQgPSBleHRlbmQ7XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiIsInZhciBMaW5rZWRMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB0aGlzLnRhaWwgPSBudWxsO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkVG9UYWlsID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgdGljayA9IHtcbiAgICAgICAgZnVuYzogZm4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhZCkge1xuICAgICAgICB0aGlzLmhlYWQgPSB0aWNrO1xuICAgICAgICB0aGlzLmhlYWQubmV4dCA9IHRoaXMudGFpbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YWlsKSB7XG4gICAgICAgIHRoaXMudGFpbC5uZXh0ID0gdGljaztcbiAgICB9XG4gICAgXG4gICAgdGhpcy50YWlsID0gdGljaztcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLnJlbW92ZUhlYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJldmlvdXNIZWFkO1xuXG4gICAgaWYgKHRoaXMuaGVhZCkge1xuICAgICAgICBwcmV2aW91c0hlYWQgPSB0aGlzLmhlYWQuZnVuYztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWFkLm5leHQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGhpcy5oZWFkLm5leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50YWlsID0gbnVsbDtcbiAgICAgICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlvdXNIZWFkO1xufTtcblxudmFyIFBFTkRJTkcgID0ge30sXG4gICAgUkVTT0xWRUQgPSB7fSxcbiAgICBSRUpFQ1RFRCA9IHt9OyBcblxudmFyIFZvdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2b3cgPSB7fTtcblxuICAgIHZhciBzdGF0dXMgICAgICAgPSBQRU5ESU5HO1xuICAgIHZhciByZXNvbHZlVGlja3MgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciByZWplY3RUaWNrcyAgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciBkb25lVGljaywgZXhjZXB0aW9uLCB2YWwsIGZuO1xuXG4gICAgdm93LnJlc29sdmUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVKRUNURUQgfHwgIXJlc29sdmVUaWNrcy5oZWFkKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlRG9uZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdHVzID0gUkVTT0xWRUQ7XG4gICAgICAgICAgICB2YWwgPSByZXQ7XG5cbiAgICAgICAgICAgIGZuID0gcmVzb2x2ZVRpY2tzLnJlbW92ZUhlYWQoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YWwgPSBmbi5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gUkVKRUNURUQ7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgICAgICB2b3cucmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHZhbCAmJiB0eXBlb2YgdmFsLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB2YWwudGhlbih2b3cucmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3cucmVzb2x2ZSh2YWwpO1xuICAgICAgICB9LmJpbmQodGhpcyksIDApO1xuICAgIH07XG5cbiAgICB2b3cucmVqZWN0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSRVNPTFZFRCB8fCAhcmVqZWN0VGlja3MuaGVhZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcblxuICAgICAgICAgICAgZm4gPSByZWplY3RUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZXJyO1xuICAgICAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcblxuICAgIH07XG5cblxuICAgIHZvdy5wcm9taXNlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHt9XG5cbiAgICAgICAgcHJvbWlzZS50aGVuID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVzb2x2ZVRpY2tzLmFkZFRvVGFpbChmdW5jKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByb21pc2UuY2F0Y2ggPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICByZWplY3RUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmRvbmUgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICBkb25lVGljayA9IGZ1bmM7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZvdztcbiAgICBcbiAgICBmdW5jdGlvbiBoYW5kbGVEb25lKCkge1xuICAgICAgICBpZiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRvbmVUaWNrKSB7XG4gICAgICAgICAgICBkb25lVGljay5jYWxsKHRoaXMsIHZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlVGlja3MgPSBudWxsO1xuICAgICAgICByZWplY3RUaWNrcyAgPSBudWxsO1xuICAgICAgICBkb25lVGljayAgICAgPSBudWxsO1xuICAgICAgICBleGNlcHRpb24gICAgPSBudWxsO1xuICAgICAgICB2YWwgICAgICAgICAgPSBudWxsO1xuICAgICAgICBmbiAgICAgICAgICAgPSBudWxsO1xuXG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVm93O1xuXG4iLCJ3aW5kb3cuVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTsiXX0=
