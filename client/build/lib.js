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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2ZhY3RvcnkvZmFjdG9yeS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9JZEdlbmVyYXRvci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9hamF4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9oZWxwZXJzL2RlZmF1bHRzLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9oZWxwZXJzL2V4dGVuZC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9wYXJhbS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaW5kZXguanMiLCIuLi9UcmluaXR5SlMvc3JjL21vZHVsZS9tb2R1bGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL3Jlc291cmNlL3Jlc291cmNlLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9zdHlsaXplci9zdHlsaXplci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdmlldy92aWV3LmpzIiwiLi4vVHJpbml0eUpTL3NyYy92b3cvdm93LmpzIiwiY2xpZW50L3NyYy9saWIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2NvbnRyb2xsZXInKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2V4dGVuZCcpO1xuXG52YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLnZpZXdFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLnZpZXdFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLnZpZXcuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLm1vZGVsRXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5tb2RlbEV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMubW9kZWwuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cbkNvbnRyb2xsZXIuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7IiwidmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBpZCA9IGlkO1xuICAgIHZhciBldmVudHMgPSB7fTtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGV2dCA9IHt9XG4gICAgICAgIGV2dC5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICAgICAgY29udGV4dC5fc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnB1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll9wdWJsaXNoKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll91bnN1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC51bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBjb250ZXh0Ll91bnN1YnNjcmliZUFsbChldmVudCwgaWQsIGV2ZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV2dDtcbiAgICB9KSh0aGlzKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoIWV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XSA9IHt9O1xuICAgIH1cblxuICAgIGlmICghZXZlbnRzW2V2ZW50XVtpZF0pIHtcbiAgICAgICAgZXZlbnRzW2V2ZW50XVtpZF0gPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIGNhbGxiYWNrIGZ1bmN0aW9uIG11c3QgYmUgcGFzc2VkIGluIHRvIHN1YnNjcmliZScpO1xuICAgIH1cbiAgICBcbiAgICBldmVudHNbZXZlbnRdW2lkXS5wdXNoKGZ1bmMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKSB7XG4gICAgY3R4ID0gY3R4IHx8IG51bGw7XG4gICAgYXJncyA9IGFyZ3MgfHwgbnVsbDtcblxuICAgIHZhciBldmVudEJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgZm9yICh2YXIgYnVja2V0IGluIGV2ZW50QnVja2V0KSB7XG4gICAgICAgICAgICB2YXIgY2JRdWV1ZSA9IGV2ZW50QnVja2V0W2J1Y2tldF07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYlF1ZXVlKSkge1xuICAgICAgICAgICAgICAgIGNiUXVldWUuZm9yRWFjaChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgICAgICAgICBjYi5jYWxsKHRoaXMsIGN0eCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpIHtcbiAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChidWNrZXQpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gYnVja2V0W2lkXTtcblxuICAgICAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGZuLCBpKSB7XG4gICAgICAgICAgICBpZihmbiA9PT0gZnVuYykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uKGV2ZW50LCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgfSBcblxuICAgIGZvciAodmFyIGV2dCBpbiBldmVudHMpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuc3Vic3JpYmVPbmUoZXZlbnQpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICAgICAgaWYgKGJ1Y2tldCAmJiBidWNrZXRbaWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgYnVja2V0W2lkXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRCdXM7XG4iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdmYWN0b3J5Jyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi4vaGVscGVycy9leHRlbmQnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZGVmYXVsdHMnKTtcblxudmFyIEZhY3RvcnkgPSB7fTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlc291cmNlcyA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICB0aGlzLl9zZXQoa2V5LCB2YWwsIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMudW5zZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdGhpcy5fdW5zZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KGtleSwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhdHRyaWJ1dGVzKSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQoZGVmYXVsdHMob3B0cywgdGhpcy5kZWZhdWx0cykpO1xuICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnaW5pdGlhbGl6ZScsIHRoaXMsIG9wdHMpO1xufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLl9zZXQgPSBmdW5jdGlvbihrZXksIHZhbCwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLl9zZXQoaywga2V5W2tdLCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWw7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlJywgdGhpcywgcmV0KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2U6JyArIGtleSwgdGhpcywgdmFsKTtcbiAgICB9XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2dldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gYXR0cmlidXRlc1trZXldO1xuICAgIH0gIGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgIH1cbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fdW5zZXQgPSBmdW5jdGlvbihrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgZGVsZXRlIGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdkZWxldGUnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2RlbGV0ZTonICsga2V5LCB0aGlzLCByZXRba2V5XSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IgKHZhciBrIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Vuc2V0KGspO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbihyZXNvdXJjZSwgaWQpIHtcbiAgICB0aGlzLnJlc291cmNlc1tyZXNvdXJjZV0gPSByZXNvdXJjZTtcblxuICAgIHJlc291cmNlLmV2ZW50QnVzLnN1YnNjcmliZSgnY2hhbmdlOicgKyBpZCwgZnVuY3Rpb24oY3R4LCBhdHRycykge1xuICAgICAgICBmb3IgKHZhciBrIGluIGF0dHJzKSB7XG4gICAgICAgICAgICB0aGlzLnNldChrLCBhdHRyc1trXSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgcmVzb3VyY2UuZXZlbnRCdXMuc3Vic2NyaWJlKCdkZWxldGU6JyArIGlkLCBmdW5jdGlvbihjdHgsIGF0dHJzKSB7XG4gICAgICAgIHRoaXMudW5zZXQoKTtcbiAgICB9LmJpbmQodGhpcykpXG59O1xuXG5GYWN0b3J5LmV4dGVuZCA9IGV4dGVuZDtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWN0b3J5O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgY291bnQgPSAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBzdHIgKyBjb3VudDtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbn07XG5cbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgdmFyIHZvdyA9IFZvdygpO1xuXG4gICAgaWYgKG9wdHMuZW5jb2RlKSB7XG4gICAgICAgIG9wdHMudXJsICs9IGVuY29kZVVSSShvcHRzLmVuY29kZShvcHRzLnBheWxvYWQpKTtcbiAgICB9XG5cbiAgICB4aHIub3BlbihvcHRzLnR5cGUudG9VcHBlckNhc2UoKSwgb3B0cy51cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBvcHRzLmNvbnRlbnRUeXBlKTtcblxuICAgIGZvciAodmFyIGhlYWRlciBpbiBvcHRzLmhlYWRlcnMpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCBvcHRzLmhlYWRlcnNbaGVhZGVyXSk7XG4gICAgfVxuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8PSAyOTkpIHtcbiAgICAgICAgICAgIHZvdy5yZXNvbHZlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm93LnJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLmVuY29kZSkge1xuICAgICAgICB4aHIuc2VuZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KG9wdHMucGF5bG9hZCkpO1xuICAgIH1cblxuICAgIHJldHVybiB2b3cucHJvbWlzZTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBkZWZhdWx0cykge1xuICAgIGRlZmF1bHRzID0gZGVmYXVsdHMgfHwge307XG4gICAgXG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRzKSB7XG4gICAgICAgIGlmICghb2JqW2tleV0pIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcblxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIgZW5jb2RlZFN0cmluZyA9ICcnO1xuICAgIGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgIGlmIChlbmNvZGVkU3RyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBlbmNvZGVkU3RyaW5nICs9ICcmJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuY29kZWRTdHJpbmcgKz0gZW5jb2RlVVJJKHByb3AgKyAnPScgKyBvYmplY3RbcHJvcF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVkU3RyaW5nO1xufSIsInZhciBGYWN0b3J5ID0gcmVxdWlyZSgnLi9mYWN0b3J5L2ZhY3RvcnknKTtcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2NvbnRyb2xsZXInKTtcbnZhciBWaWV3ID0gcmVxdWlyZSgnLi92aWV3L3ZpZXcnKTtcbnZhciBTdHlsaXplciA9IHJlcXVpcmUoJy4vc3R5bGl6ZXIvc3R5bGl6ZXInKTtcbnZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBNb2R1bGUgPSByZXF1aXJlKCcuL21vZHVsZS9tb2R1bGUnKTtcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoJy4vcmVzb3VyY2UvcmVzb3VyY2UnKTtcbnZhciBWb3cgPSByZXF1aXJlKCcuL3Zvdy92b3cnKTtcblxudmFyIGdFdmVudEJ1cyA9IG5ldyBFdmVudEJ1cygpOztcblxudmFyIFRyaW8gPSB7XG4gICAgRmFjdG9yeTogRmFjdG9yeSxcbiAgICBDb250cm9sbGVyOiBDb250cm9sbGVyLFxuICAgIFZpZXc6IFZpZXcsXG4gICAgVm93OiBWb3csXG4gICAgU3R5bGl6ZXI6IG5ldyBTdHlsaXplcigpLFxuICAgIE1vZHVsZTogbmV3IE1vZHVsZSgpLFxuICAgIFJlc291cmNlOiBuZXcgUmVzb3VyY2UoKVxufVxuXG5UcmlvLnJlZ2lzdGVyR2xvYmFsRXZlbnRCdXMgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiBnRXZlbnRCdXMucmVnaXN0ZXIoaWQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmlvO1xuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcbnZhciBtb2R1bGVTdG9yZSA9IHt9O1xuXG52YXIgTW9kdWxlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgIGRvbmUoZnVuYygpKTtcbiAgICB9O1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihtb2R1bGVzKSB7XG4gICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgdmFyIGNvdW50ICA9IE9iamVjdC5rZXlzKG1vZHVsZXMpO1xuICAgIHZhciB2b3cgPSBWb3coKTtcbiAgICB2YXIgcmV0ID0ge307XG4gICAgdmFyIHVybDtcblxuICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuXG4gICAgdm93LnByb21pc2UuYW5kID0ge307XG4gICAgdm93LnByb21pc2UuYW5kLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgICAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICAgICAgdm93LnByb21pc2VcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmMuYmluZCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgIC5kb25lKGRvbmUpO1xuICAgICAgICB9O1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB2b3cucHJvbWlzZTtcblxuICAgIGZ1bmN0aW9uIF9pbXBvcnQoa2V5KSB7XG4gICAgICAgIHZhciB1cmwgPSBtb2R1bGVzW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZVN0b3JlW2tleV07XG4gICAgICAgIFxuICAgICAgICBpZiAoIW1vZHVsZSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICAgICAgICBzY3JpcHQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gICAgICAgICAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlciA9IFZvdygpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgJyArIGtleSArICcuLi4nKTtcblxuICAgICAgICAgICAgICAgIGRlZmVyLnByb21pc2UudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFtrZXldID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdy5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2NyaXB0LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0oZGVmZXIucmVzb2x2ZSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcywga2V5KTtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm93LnJlc29sdmUobW9kdWxlKCkpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCJ2YXIgVm93ID0gcmVxdWlyZSgnLi4vdm93L3ZvdycpO1xudmFyIEZhY3RvcnkgPSByZXF1aXJlKCcuLi9mYWN0b3J5L2ZhY3RvcnknKTtcbnZhciBhamF4ID0gcmVxdWlyZSgnLi4vaGVscGVycy9hamF4Jyk7XG52YXIgcGFyYW0gPSByZXF1aXJlKCcuLi9oZWxwZXJzL3BhcmFtJyk7XG52YXIgbWV0aG9kcyA9IFsncmVhZCcsICdjcmVhdGUnLCAndXBkYXRlJywgJ2RlbGV0ZSddO1xudmFyIERhdGEgPSBGYWN0b3J5LmV4dGVuZCh7XG4gICAgYWpheDogZnVuY3Rpb24ob3B0cyl7XG4gICAgICAgIGlmICghb3B0cy51cmwpIHRocm93IG5ldyBFcnJvcignVXJsIGlzIHJlcXVpcmVkLicpO1xuICAgICAgICBpZiAoIW9wdHMudHlwZSkgdGhyb3cgbmV3IEVycm9yKCdSZXF1ZXN0IHR5cGUgaXMgcmVxdWlyZWQuJyk7XG5cbiAgICAgICAgb3B0cy5jb250ZW50VHlwZSA9IG9wdHMuY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICBvcHRzLmVuY29kZSAgICAgID0gb3B0cy5lbmNvZGUgfHwgbnVsbDtcbiAgICAgICAgb3B0cy5wYXlsb2FkICAgICA9IG9wdHMucGF5bG9hZCB8fCBudWxsO1xuICAgICAgICBvcHRzLmluZGV4QnkgICAgID0gb3B0cy5pbmRleEJ5IHx8ICdpZCc7XG5cbiAgICAgICAgcmV0dXJuIGFqYXgob3B0cylcbiAgICAgICAgICAgICAgICAudGhlbihfcGFyc2UuYmluZCh0aGlzKSlcbiAgICAgICAgICAgICAgICAudGhlbihfdXBkYXRlU3RvcmUuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgZnVuY3Rpb24gX3VwZGF0ZVN0b3JlKHJzcCkge1xuICAgICAgICAgICAgaWYgKG9wdHMudHlwZS50b1VwcGVyQ2FzZSgpID09PSAnREVMRVRFJykge1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJzcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcnNwLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnNldChkW29wdHMuaW5kZXhCeV0sIGQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJzcCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51bnNldChyc3Bbb3B0cy5pbmRleEJ5XSwgcnNwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJzcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcnNwLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoZFtvcHRzLmluZGV4QnldLCBkKTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByc3AgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KHJzcFtvcHRzLmluZGV4QnldLCByc3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByc3A7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfcGFyc2UocnNwKSB7XG4gICAgICAgICAgICBpZiAob3B0cy5wYXJzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcHRzLnBhcnNlKHJzcCk7XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2UocnNwKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwYXJzZTogZnVuY3Rpb24ocnNwKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJzcCk7XG4gICAgfVxufSk7XG5cbnZhciBkYXRhc3RvcmUgPSB7fTtcbnZhciBSZXNvdXJjZSA9IGZ1bmN0aW9uKCkge1xufTtcblxuUmVzb3VyY2UucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmIChkYXRhc3RvcmVbbmFtZV0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvdXJjZSAnICsgbmFtZSArICcgYWxyZWFkeSBleGlzdC4nKTtcbiAgICB9XG5cbiAgICBkYXRhc3RvcmVbbmFtZV0gPSBuZXcgRGF0YSgpO1xuICAgIHJldHVybiBkYXRhc3RvcmVbbmFtZV07XG59O1xuXG5SZXNvdXJjZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBkYXRhc3RvcmVbbmFtZV0gPyBkYXRhc3RvcmVbbmFtZV0gOiB0aGlzLnJlZ2lzdGVyKG5hbWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc291cmNlO1xuIiwidmFyIG1peGlucyA9IHt9O1xudmFyIHZhcmlhYmxlcyA9IHt9O1xuXG52YXIgU3R5bGl6ZXIgPSBmdW5jdGlvbigpIHtcblxufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIHJldCA9ICcnO1xuXG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gc3R5bGUpIHtcbiAgICAgICAgcmV0ICs9IHNlbGVjdG9yICsgJ3snO1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IHN0eWxlW3NlbGVjdG9yXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZyA9IHByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICByZXQgKz0gcHJvcCArICc6JyArIHNldHRpbmcgKyAnOyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gcmV0LnNsaWNlKDAsIHJldC5sZW5ndGggLSAxKTtcbiAgICAgICAgcmV0ICs9ICd9JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnJlZ2lzdGVyTWl4aW5zID0gZnVuY3Rpb24oa2V5LCBmdW5jKSB7XG4gICAgbWl4aW5zW2tleV0gPSBmdW5jO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnJlZ2lzdGVyVmFyaWFibGVzID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICB2YXJpYWJsZXNba2V5XSA9IHZhbDtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5nZXRWYXJpYWJsZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICghdmFyaWFibGVzW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVmFyaWFibGUgJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHZhcmlhYmxlc1trZXldO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmdldE1peGlucyA9IGZ1bmN0aW9uKGtleSwgb3B0cykge1xuICAgIGlmICghbWl4aW5zW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTWl4aW4gJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIG1peGluc1trZXldLmNhbGwodGhpcywgb3B0cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxpemVyOyIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgU3R5bGl6ZXIgPSByZXF1aXJlKCcuLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCd2aWV3Jyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi4vaGVscGVycy9leHRlbmQnKTtcblxudmFyIFZpZXcgPSB7fTtcblxuVmlldy5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlIHx8IHt9O1xuICAgIHZhciBzdHlsZSA9IHRoaXMuc3R5bGUgfHwge307XG4gICAgdmFyIHN0eWxlVGFnLCBpbmxpbmVTdHlsZTtcblxuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMucmVmSW5kZXggPSB7fTtcblxuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG5cbiAgICBpZiAodGhpcy5pc1dlYkNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLnN0eWxlID0gU3R5bGl6ZXIucHJvdG90eXBlLnN0cmluZ2lmeShzdHlsZSk7XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLnJlbmRlclRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZVRhZy5pbm5lclRleHQgPSB0aGlzLnN0eWxlO1xuICAgICAgICB0aGlzLnRlbXBsYXRlLmFwcGVuZENoaWxkKHN0eWxlVGFnKVxuICAgICAgICB0aGlzLmNyZWF0ZUNvbXBvbmVudCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlubGluZVN0eWxlID0gdGhpcy5zdHlsZVsnOmhvc3QnXSB8fCB7fTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMucmVuZGVyVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnQoKTtcbiAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBpbmxpbmVTdHlsZSkge1xuICAgICAgICAgICAgdGhpcy5lbC5zdHlsZVthdHRyXSA9IGlubGluZVN0eWxlW2F0dHJdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLnJlbmRlclRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICB2YXIgZWw7XG5cbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIGNyZWF0ZUVsZW1lbnRzLmNhbGwodGhpcywgdGVtcGxhdGUsIGVsKTtcblxuICAgIHJldHVybiBlbDtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRzKHRlbXBsYXRlLCBiYXNlKSB7XG4gICAgICAgIGZvciAodmFyIHRhZyBpbiB0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgaWYgKGlzVmFsaWRUYWcodGFnKSkge1xuICAgICAgICAgICAgICAgIHZhciBlbCA9IGNyZWF0ZU9uZUVsZW1lbnQuY2FsbCh0aGlzLCB0YWcpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1dlYkNvbXBvbmVudCAmJiB0aGlzLnN0eWxlW3RhZ10pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW5saW5lU3R5bGUoZWwsIHRoaXMuc3R5bGVbdGFnXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgIGNyZWF0ZUVsZW1lbnRzLmNhbGwodGhpcywgdGVtcGxhdGVbdGFnXSwgZWwpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YWcgPT09ICdyZWYnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZJbmRleFt0ZW1wbGF0ZVt0YWddXSA9IGJhc2U7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRhZyA9PT0gJ3RleHRDb250ZW50Jykge1xuICAgICAgICAgICAgICAgIGJhc2UudGV4dENvbnRlbnQgPSB0ZW1wbGF0ZVt0YWddO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRFdmVudHMuY2FsbCh0aGlzLCBiYXNlLCB0YWcsIHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKHBhcnNlZFsxXSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBwYXJzZWRbMl07XG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VkWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGVsLmlkID0gcGFyc2VkWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZElubGluZVN0eWxlKGVsLCBzdHlsZSkge1xuICAgICAgICBmb3IgKHZhciBhdHRyIGluIHN0eWxlKSB7XG4gICAgICAgICAgICBlbC5zdHlsZVthdHRyXSA9IHN0eWxlW2F0dHJdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkRXZlbnRzKGVsLCBvcmlnaW5FdnQsIG5ld0V2dCkge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKG9yaWdpbkV2dCwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKG5ld0V2dCwgdGhpcywgZSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gdGFnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVmFsaWRUYWcodGFnKSB7XG4gICAgICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgICAgICByZXR1cm4gKHRhZ1sxXSA9PT0gJyMnIHx8IHRhZ1sxXSA9PT0gJy4nKSAmJiB0YWcubGVuZ3RoID09PSAzO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIFJvb3QsIHJvb3Q7XG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIFxuXG4gICAgdHJ5IHtcbiAgICAgICAgUm9vdCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCh0aGlzLnRhZ05hbWUsIHtcbiAgICAgICAgICAgIHByb3RvdHlwZTogcHJvdG9cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWwgPSBuZXcgUm9vdCgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLnRhZ05hbWUpO1xuICAgIH1cblxuICAgIHRoaXMuZWwgPSBuZXcgUm9vdCgpXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZUNvbXBvbmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2aWV3ID0gdGhpcztcbiAgICB2YXIgUm9vdCwgcm9vdDtcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgXG4gICAgcHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzaGFkb3cgPSB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcbiAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKHZpZXcudGVtcGxhdGUpO1xuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICAgICAgcHJvdG90eXBlOiBwcm90b1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG4gICAgfVxuXG5cbiAgICByZXR1cm4gdGhpcztcblxuICAgIGZ1bmN0aW9uIGlzUmVnaXN0ZWQgKG5hbWUpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpLmNvbnN0cnVjdG9yICE9PSBIVE1MRWxlbWVudDtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKCF0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgZWwuY2xhc3NOYW1lICs9IFwiIFwiICsgY2xhc3NOYW1lO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAodGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlZywnICcpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgcmV0dXJuICEhZWwuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKSk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWwucmVtb3ZlKCk7XG4gICAgdGhpcy5lbCA9IG51bGw7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMudW5zdWJzY3JpYmVBbGwoKTtcbn07XG5cblZpZXcuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7XG4iLCJ2YXIgTGlua2VkTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgdGhpcy50YWlsID0gbnVsbDtcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLmFkZFRvVGFpbCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHRpY2sgPSB7XG4gICAgICAgIGZ1bmM6IGZuLFxuICAgICAgICBuZXh0OiBudWxsXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmhlYWQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGljaztcbiAgICAgICAgdGhpcy5oZWFkLm5leHQgPSB0aGlzLnRhaWw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFpbCkge1xuICAgICAgICB0aGlzLnRhaWwubmV4dCA9IHRpY2s7XG4gICAgfVxuICAgIFxuICAgIHRoaXMudGFpbCA9IHRpY2s7XG59O1xuXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5yZW1vdmVIZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByZXZpb3VzSGVhZDtcblxuICAgIGlmICh0aGlzLmhlYWQpIHtcbiAgICAgICAgcHJldmlvdXNIZWFkID0gdGhpcy5oZWFkLmZ1bmM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhZC5uZXh0KSB7XG4gICAgICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGFpbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzSGVhZDtcbn07XG5cbnZhciBQRU5ESU5HICA9IHt9LFxuICAgIFJFU09MVkVEID0ge30sXG4gICAgUkVKRUNURUQgPSB7fTsgXG5cbnZhciBWb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdm93ID0ge307XG5cbiAgICB2YXIgc3RhdHVzICAgICAgID0gUEVORElORztcbiAgICB2YXIgcmVzb2x2ZVRpY2tzID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgcmVqZWN0VGlja3MgID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgZG9uZVRpY2ssIGV4Y2VwdGlvbiwgdmFsLCBmbjtcblxuICAgIHZvdy5yZXNvbHZlID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFJFSkVDVEVEIHx8ICFyZXNvbHZlVGlja3MuaGVhZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXR1cyA9IFJFU09MVkVEO1xuICAgICAgICAgICAgdmFsID0gcmV0O1xuXG4gICAgICAgICAgICBmbiA9IHJlc29sdmVUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFsID0gZm4uY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICAgICAgdm93LnJlamVjdChlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdy5yZXNvbHZlKHZhbCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG4gICAgfTtcblxuICAgIHZvdy5yZWplY3QgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFJFU09MVkVEIHx8ICFyZWplY3RUaWNrcy5oZWFkKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlRG9uZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdHVzID0gUkVKRUNURUQ7XG4gICAgICAgICAgICBleGNlcHRpb24gPSBlO1xuXG4gICAgICAgICAgICBmbiA9IHJlamVjdFRpY2tzLnJlbW92ZUhlYWQoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBleGNlcHRpb24gPSBlcnI7XG4gICAgICAgICAgICAgICAgdm93LnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm93LnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9LmJpbmQodGhpcyksIDApO1xuXG4gICAgfTtcblxuXG4gICAgdm93LnByb21pc2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwcm9taXNlID0ge31cblxuICAgICAgICBwcm9taXNlLnRoZW4gPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICByZXNvbHZlVGlja3MuYWRkVG9UYWlsKGZ1bmMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJvbWlzZS5jYXRjaCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIHJlamVjdFRpY2tzLmFkZFRvVGFpbChmdW5jKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByb21pc2UuZG9uZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIGRvbmVUaWNrID0gZnVuYztcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcblxuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gdm93O1xuICAgIFxuICAgIGZ1bmN0aW9uIGhhbmRsZURvbmUoKSB7XG4gICAgICAgIGlmIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZG9uZVRpY2spIHtcbiAgICAgICAgICAgIGRvbmVUaWNrLmNhbGwodGhpcywgdmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVUaWNrcyA9IG51bGw7XG4gICAgICAgIHJlamVjdFRpY2tzICA9IG51bGw7XG4gICAgICAgIGRvbmVUaWNrICAgICA9IG51bGw7XG4gICAgICAgIGV4Y2VwdGlvbiAgICA9IG51bGw7XG4gICAgICAgIHZhbCAgICAgICAgICA9IG51bGw7XG4gICAgICAgIGZuICAgICAgICAgICA9IG51bGw7XG5cbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWb3c7XG5cbiIsIndpbmRvdy5UcmlvID0gcmVxdWlyZSgndHJpbycpOyJdfQ==
