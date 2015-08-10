(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var IdGenerator = require('../helpers/IdGenerator')('component');
var extend = require('../helpers/extend');
var store = {};

var Component = {};

Component.register = function(opts) {
    if (store[opts.tagName]) {
        return store[opts.tagName];
    }

    var param = {};

    // Set Prototype of custom element
    var proto = Object.create(HTMLElement.prototype);

    _extendPrototype.call(proto, opts);

    proto.createdCallback = function() {
        var shadow = this.createShadowRoot();
        shadow.appendChild(opts.fragment.cloneNode(true));

        this.uuid = IdGenerator();

        if (opts.style) {
            shadow.appendChild(opts.style.cloneNode(true));
        }
        if (opts.onCreate) {
            opts.onCreate.apply(this, arguments);
        }
    };

    proto.attachedCallback = function() {
        if (opts.onAttach) {
            opts.onAttach.apply(this, arguments);
        }
        _addEventListeners.call(this, opts.events);
    }

    proto.detachedCallback = function() {
        if (opts.onDetach) {
            opts.onDetach.apply(this, arguments);
        }
    }

    proto.attributeChangedCallback = function(attrName, oldVal, newVal) {
        if (opts.onAttributesChange) {
            opts.onAttributesChange[attrName].apply(this, [oldVal, newVal]);
        }
    }

    param.prototype = proto;

    // Set base element (Optional)
    if (opts.extends) {
        param.extends = opts.extends;
    }

    // Register custom element
    store[opts.tagName] = document.registerElement(opts.tagName, param);
    return store[opts.tagName];
};

Component.extend = function(baseComponent, opts) {
    var Base = store[baseComponent];
    var param = {};
    // Set Prototype of custom element
    var proto = Object.create(HTMLElement.prototype);

    _extendPrototype.call(proto, opts);

    proto.createdCallback = function() {
        Base.prototype.createdCallback.apply(this, arguments);
        if (opts.onCreate) {
            opts.onCreate.apply(this, arguments);
        }
    };

    proto.attachedCallback = function() {
        Base.prototype.attachedCallback.apply(this, arguments);
        if (opts.onAttach) {
            opts.onAttach.apply(this, arguments);
        }
        _addEventListeners.call(this, opts.events);
    }

    proto.detachedCallback = function() {
        Base.prototype.detachedCallback.apply(this, arguments);
        if (opts.onDetach) {
            opts.onDetach.apply(this, arguments);
        }
    }

    proto.attributeChangedCallback = function(attrName, oldVal, newVal) {
        Base.prototype.attributeChangedCallback.apply(this, arguments);
        if (opts.onAttributesChange) {
            opts.onAttributesChange[attrName].apply(this, [oldVal, newVal]);
        }
    }

    param.prototype = proto;

    // Register custom element
    return document.registerElement(opts.tagName, param);
};

function _addEventListeners(events) {
    for (var evt in events) {
        var param = evt.split(' ');
        var eventName = param[0];
        var element = this.shadowRoot.querySelector(param[1]);
        var handler = events[evt];
        var fn = this[handler] = this[handler].bind(this)
        
        element.addEventListener(eventName, fn);
    }
}

function _extendPrototype(protos) {
    for (var proto in protos) {
        switch (proto) {
            case 'exends':
                break;
            case 'onCreate':
                break;
            case 'onDetach':
                break;
            case 'onAttributesChange':
                break;
            case 'onAttach':
                break;
            case 'tagName':
                break;
            case 'fragment':
                break;
            case 'style':
                break;
            case 'events':
                break;
            default:
                this[proto] = protos[proto];
        }
    }
}

module.exports = Component;

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

    this.uuid = IdGenerator();
    this.resources = {};
    this.eventBus = opts.eventBus || new EventBus();
    this.eventBus = this.eventBus.register(this.uuid);

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
            this._unset(k, attributes);
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
},{"../vow/vow":15}],6:[function(require,module,exports){
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
var Service = require('./service/service');
var Component = require('./component/component');
var Stylizer = require('./stylizer/stylizer');
var EventBus = require('./eventBus/eventBus');
var Module = require('./module/module');
var Resource = require('./resource/resource');
var Renderer = require('./renderer/renderer');
var Vow = require('./vow/vow');

var gEventBus = new EventBus();;

var Trio = {
    Factory: Factory,
    Service: Service,
    Component: Component,
    Vow: Vow,
    Stylizer: new Stylizer(),
    Renderer: new Renderer(),
    Module: new Module(),
    Resource: new Resource()
}

Trio.registerGlobalEventBus = function(id) {
    return gEventBus.register(id);
};

module.exports = Trio;

},{"./component/component":1,"./eventBus/eventBus":2,"./factory/factory":3,"./module/module":10,"./renderer/renderer":11,"./resource/resource":12,"./service/service":13,"./stylizer/stylizer":14,"./vow/vow":15}],10:[function(require,module,exports){
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

},{"../vow/vow":15}],11:[function(require,module,exports){
var Renderer = function(){

};

Renderer.prototype.createTemplate = function() {
    return new Template();
};

var Template = function(){
    this._currentState = [];
    this._queue = [];
    this._conditional = undefined;
    this._state;
    this._loop;
    this._start;

};

/**
 * Create DOM node
 * @param  {string} tagName Element name
 * @return {instance}       this
 */
Template.prototype.create = function(tagName){
    tagName = parseTag(tagName);
    var fn = function() {
        var el = document.createElement(tagName[0]);
        if (tagName[1] === '.') {
            el.className = tagName[2];
        } else if (tagName[1] === '#') {
            el.id = tagName[2];
        }
        this._currentState.push(el);
    }.bind(this)
    this._queue.push({
        type: 'open',
        fn: fn
    });
    return this;
};

Template.prototype.addClass = function(className) {
    var fn = function(d) {
        var el = grabLast.call(this);
        className = evaluate(d, className);
        var separator = el.className.length > 0 ? ' ' : '';
        if (!hasClass(el,className)) {
            el.className += separator + className;
        }
    }.bind(this);
    this._queue.push({
        type: 'addClass',
        fn: fn
    });
    return this;
};

Template.prototype.text = function(content) {
    var fn = function(d) {
        var el = grabLast.call(this);
        el.textContent = evaluate(d, content);
    }.bind(this);
    this._queue.push({
        type: 'text',
        fn: fn
    });
    return this;
};

Template.prototype.attr = function(attr, val) {
    var fn = function(d) {
        var el = grabLast.call(this);
        el.setAttribute(evaluate(d, attr), evaluate(d, val));
    }.bind(this);
    this._queue.push({
        type: 'attr',
        fn: fn
    });
    return this;
};

Template.prototype.style = function(attr, val) {
    var fn = function(d) {
        var el = grabLast.call(this);
        el.style[evaluate(d, attr)] = evaluate(d, val);
    }.bind(this);
    this._queue.push({
        type: 'style',
        fn: fn
    });
    return this;
};

Template.prototype.removeClass = function(className) {
    var fn = function(d) {
        var el = grabLast.call(this);
        className = evaluate(d, className);
        if (hasClass(el,className)) {
            var reg = new RegExp('(\\s|^)'+className+'(\\s|$)');
            el.className = el.className.replace(reg,' ');
        }
    }.bind(this);
    this._queue.push({
        type: 'removeClass',
        fn: fn
    });
    return this;
};

Template.prototype.append = function() {
    var fn = function(d) {
        var el = this._currentState.pop();
        if (this._currentState.length === 0) {
            this.previousFragment.appendChild(el);
        } else {
            var parent = grabLast.call(this);
            parent.appendChild(el);
        }
    }.bind(this);
    this._queue.push({
        type: 'close',
        fn: fn
    });
    return this;
};

Template.prototype.appendLast = function() {
  var fn = function(d) {
      var el = this._currentState.pop();
      this.previousFragment.appendChild(el);
  }.bind(this);
  this._queue.push({
      type: 'end',
      fn: fn
  });
  return this;  
};

Template.prototype.if = function(funcOrKey) {
    var fn = function(d) {
        this._state = 'conditional';
        funcOrKey = evaluate(d, funcOrKey);
        this._conditional = !!funcOrKey;
    }.bind(this)
    this._queue.push({
        type: 'if',
        fn: fn
    });
    return this;
}

Template.prototype.else = function() {
    var fn = function(d) {
        this._conditional = !this._conditional;
    }.bind(this);
    this._queue.push({
        type: 'else',
        fn: fn
    });
    return this;
}

Template.prototype.each = function(funcOrKey) {
    var fn = function(d, i) {
        this._loop  = evaluate(d, funcOrKey);
        this._state = 'loop';
        this._start = i;
    }.bind(this);
    this._queue.push({
        type: 'each',
        fn: fn
    });
    return this;
}

Template.prototype.done = function() {
    var fn = function(d, i) {
        this._conditional = undefined;
        this._state       = undefined;
    }.bind(this);
    this._queue.push({
        type: 'done',
        fn: fn
    });
    return this;
}

Template.prototype.render = function(data) {
    this.previousFragment = document.createDocumentFragment();
    this._queue.forEach(function(q, i) {
        switch (this._state) {
            case 'conditional':
                if (this._conditional || q.type === 'else' || q.type === 'done') {
                    q.fn(data, i);
                }
                break;
            case 'loop':
                if (q.type === 'done') {
                    this._loop.forEach(function(l, j) {
                        for (var start = this._start + 1; start < i; start++) {
                            var loopFn = this._queue[start];
                            loopFn.fn(l, j);
                        }
                    }.bind(this));
                    q.fn(data, i);
                }
                break;
            default:
                q.fn(data, i);
                break;
                
        }
    }.bind(this));

    return this.previousFragment;
};

function grabLast() {
    return this._currentState[this._currentState.length - 1];
};

function hasClass(el, className) {
  return !!el.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'));
};

function parseTag(tag) {
    tag = tag.replace(/[.#]/, function(d) { return ',' + d + ','})
             .split(',');
    return tag;
};

function evaluate(data, funcOrString) {
    switch (typeof funcOrString) {
        case 'function':
            return funcOrString.apply(this, arguments);
            break;
        case 'string':
            return funcOrString;
            break;
    }
}

module.exports = Renderer;

},{}],12:[function(require,module,exports){
var Vow = require('../vow/vow');
var Factory = require('../factory/factory');
var ajax = require('../helpers/ajax');
var param = require('../helpers/param');
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

},{"../factory/factory":3,"../helpers/ajax":5,"../helpers/param":8,"../vow/vow":15}],13:[function(require,module,exports){
var IdGenerator = require('../helpers/IdGenerator')('service');
var extend = require('../helpers/extend');

var Service = {};

Service._constructor = function(opts) {
    this._initialize(opts);
};

Service._constructor.prototype._initialize = function(opts) {
    this.uuid = IdGenerator();

    if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

Service._constructor.prototype.subscribeAll = function(target, events) {
    for (var evt in events) {
        var handler = events[evt];
        var fn = this[handler] = this[handler].bind(this)
        target.eventBus.subscribe(evt, fn);
    }
};

Service.extend = extend;

module.exports = Service;
},{"../helpers/IdGenerator":4,"../helpers/extend":7}],14:[function(require,module,exports){
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

Stylizer.prototype.createStyleTag = function(style) {
    var tag = document.createElement('style');
    style = this.stringify(style);
    tag.innerText = style;
    return tag;
}

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
},{}],15:[function(require,module,exports){
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


},{}],16:[function(require,module,exports){
window.Trio = require('trio');
},{"trio":9}]},{},[16])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi9UcmluaXR5SlMvc3JjL2V2ZW50QnVzL2V2ZW50QnVzLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9mYWN0b3J5L2ZhY3RvcnkuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvYWpheC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9kZWZhdWx0cy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9leHRlbmQuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvcGFyYW0uanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2R1bGUvbW9kdWxlLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9yZW5kZXJlci9yZW5kZXJlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvcmVzb3VyY2UvcmVzb3VyY2UuanMiLCIuLi9UcmluaXR5SlMvc3JjL3NlcnZpY2Uvc2VydmljZS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3Zvdy92b3cuanMiLCJjbGllbnQvc3JjL2xpYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2NvbXBvbmVudCcpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG52YXIgc3RvcmUgPSB7fTtcblxudmFyIENvbXBvbmVudCA9IHt9O1xuXG5Db21wb25lbnQucmVnaXN0ZXIgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgaWYgKHN0b3JlW29wdHMudGFnTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuIHN0b3JlW29wdHMudGFnTmFtZV07XG4gICAgfVxuXG4gICAgdmFyIHBhcmFtID0ge307XG5cbiAgICAvLyBTZXQgUHJvdG90eXBlIG9mIGN1c3RvbSBlbGVtZW50XG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuXG4gICAgX2V4dGVuZFByb3RvdHlwZS5jYWxsKHByb3RvLCBvcHRzKTtcblxuICAgIHByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2hhZG93ID0gdGhpcy5jcmVhdGVTaGFkb3dSb290KCk7XG4gICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChvcHRzLmZyYWdtZW50LmNsb25lTm9kZSh0cnVlKSk7XG5cbiAgICAgICAgdGhpcy51dWlkID0gSWRHZW5lcmF0b3IoKTtcblxuICAgICAgICBpZiAob3B0cy5zdHlsZSkge1xuICAgICAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKG9wdHMuc3R5bGUuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5vbkNyZWF0ZSkge1xuICAgICAgICAgICAgb3B0cy5vbkNyZWF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKG9wdHMub25BdHRhY2gpIHtcbiAgICAgICAgICAgIG9wdHMub25BdHRhY2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBfYWRkRXZlbnRMaXN0ZW5lcnMuY2FsbCh0aGlzLCBvcHRzLmV2ZW50cyk7XG4gICAgfVxuXG4gICAgcHJvdG8uZGV0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAob3B0cy5vbkRldGFjaCkge1xuICAgICAgICAgICAgb3B0cy5vbkRldGFjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdG8uYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrID0gZnVuY3Rpb24oYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKSB7XG4gICAgICAgIGlmIChvcHRzLm9uQXR0cmlidXRlc0NoYW5nZSkge1xuICAgICAgICAgICAgb3B0cy5vbkF0dHJpYnV0ZXNDaGFuZ2VbYXR0ck5hbWVdLmFwcGx5KHRoaXMsIFtvbGRWYWwsIG5ld1ZhbF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGFyYW0ucHJvdG90eXBlID0gcHJvdG87XG5cbiAgICAvLyBTZXQgYmFzZSBlbGVtZW50IChPcHRpb25hbClcbiAgICBpZiAob3B0cy5leHRlbmRzKSB7XG4gICAgICAgIHBhcmFtLmV4dGVuZHMgPSBvcHRzLmV4dGVuZHM7XG4gICAgfVxuXG4gICAgLy8gUmVnaXN0ZXIgY3VzdG9tIGVsZW1lbnRcbiAgICBzdG9yZVtvcHRzLnRhZ05hbWVdID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG9wdHMudGFnTmFtZSwgcGFyYW0pO1xuICAgIHJldHVybiBzdG9yZVtvcHRzLnRhZ05hbWVdO1xufTtcblxuQ29tcG9uZW50LmV4dGVuZCA9IGZ1bmN0aW9uKGJhc2VDb21wb25lbnQsIG9wdHMpIHtcbiAgICB2YXIgQmFzZSA9IHN0b3JlW2Jhc2VDb21wb25lbnRdO1xuICAgIHZhciBwYXJhbSA9IHt9O1xuICAgIC8vIFNldCBQcm90b3R5cGUgb2YgY3VzdG9tIGVsZW1lbnRcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG5cbiAgICBfZXh0ZW5kUHJvdG90eXBlLmNhbGwocHJvdG8sIG9wdHMpO1xuXG4gICAgcHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEJhc2UucHJvdG90eXBlLmNyZWF0ZWRDYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAob3B0cy5vbkNyZWF0ZSkge1xuICAgICAgICAgICAgb3B0cy5vbkNyZWF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgQmFzZS5wcm90b3R5cGUuYXR0YWNoZWRDYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAob3B0cy5vbkF0dGFjaCkge1xuICAgICAgICAgICAgb3B0cy5vbkF0dGFjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIF9hZGRFdmVudExpc3RlbmVycy5jYWxsKHRoaXMsIG9wdHMuZXZlbnRzKTtcbiAgICB9XG5cbiAgICBwcm90by5kZXRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEJhc2UucHJvdG90eXBlLmRldGFjaGVkQ2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG9wdHMub25EZXRhY2gpIHtcbiAgICAgICAgICAgIG9wdHMub25EZXRhY2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RvLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayA9IGZ1bmN0aW9uKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCkge1xuICAgICAgICBCYXNlLnByb3RvdHlwZS5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG9wdHMub25BdHRyaWJ1dGVzQ2hhbmdlKSB7XG4gICAgICAgICAgICBvcHRzLm9uQXR0cmlidXRlc0NoYW5nZVthdHRyTmFtZV0uYXBwbHkodGhpcywgW29sZFZhbCwgbmV3VmFsXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJhbS5wcm90b3R5cGUgPSBwcm90bztcblxuICAgIC8vIFJlZ2lzdGVyIGN1c3RvbSBlbGVtZW50XG4gICAgcmV0dXJuIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChvcHRzLnRhZ05hbWUsIHBhcmFtKTtcbn07XG5cbmZ1bmN0aW9uIF9hZGRFdmVudExpc3RlbmVycyhldmVudHMpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHZhciBwYXJhbSA9IGV2dC5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgZXZlbnROYW1lID0gcGFyYW1bMF07XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3IocGFyYW1bMV0pO1xuICAgICAgICB2YXIgaGFuZGxlciA9IGV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIFxuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfZXh0ZW5kUHJvdG90eXBlKHByb3Rvcykge1xuICAgIGZvciAodmFyIHByb3RvIGluIHByb3Rvcykge1xuICAgICAgICBzd2l0Y2ggKHByb3RvKSB7XG4gICAgICAgICAgICBjYXNlICdleGVuZHMnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25DcmVhdGUnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25EZXRhY2gnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25BdHRyaWJ1dGVzQ2hhbmdlJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uQXR0YWNoJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RhZ05hbWUnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZnJhZ21lbnQnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3R5bGUnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXZlbnRzJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpc1twcm90b10gPSBwcm90b3NbcHJvdG9dO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbiIsInZhciBFdmVudEJ1cyA9IGZ1bmN0aW9uKCkge1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgaWQgPSBpZDtcbiAgICB2YXIgZXZlbnRzID0ge307XG4gICAgcmV0dXJuIChmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICAgIHZhciBldnQgPSB7fVxuICAgICAgICBldnQuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3N1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC5wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncykge1xuICAgICAgICAgICAgY29udGV4dC5fcHVibGlzaChldmVudCwgY3R4LCBhcmdzLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICAgICAgY29udGV4dC5fdW5zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgY29udGV4dC5fdW5zdWJzY3JpYmVBbGwoZXZlbnQsIGlkLCBldmVudHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBldnQ7XG4gICAgfSkodGhpcyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3N1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKCFldmVudHNbZXZlbnRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF0gPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50c1tldmVudF1baWRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF1baWRdID0gW107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHBhc3NlZCBpbiB0byBzdWJzY3JpYmUnKTtcbiAgICB9XG4gICAgXG4gICAgZXZlbnRzW2V2ZW50XVtpZF0ucHVzaChmdW5jKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fcHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cykge1xuICAgIGN0eCA9IGN0eCB8fCBudWxsO1xuICAgIGFyZ3MgPSBhcmdzIHx8IG51bGw7XG5cbiAgICB2YXIgZXZlbnRCdWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGV2ZW50QnVja2V0KSB7XG4gICAgICAgIGZvciAodmFyIGJ1Y2tldCBpbiBldmVudEJ1Y2tldCkge1xuICAgICAgICAgICAgdmFyIGNiUXVldWUgPSBldmVudEJ1Y2tldFtidWNrZXRdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2JRdWV1ZSkpIHtcbiAgICAgICAgICAgICAgICBjYlF1ZXVlLmZvckVhY2goZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IuY2FsbCh0aGlzLCBjdHgsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoYnVja2V0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IGJ1Y2tldFtpZF07XG5cbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmbiwgaSkge1xuICAgICAgICAgICAgaWYoZm4gPT09IGZ1bmMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCwgaWQsIGV2ZW50cykge1xuICAgIGlmIChldmVudCkge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gXG5cbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZ0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bnN1YnNyaWJlT25lKGV2ZW50KSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgICAgIGlmIChidWNrZXQgJiYgYnVja2V0W2lkXSkge1xuICAgICAgICAgICAgZGVsZXRlIGJ1Y2tldFtpZF07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50QnVzO1xuIiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnZmFjdG9yeScpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2RlZmF1bHRzJyk7XG5cbnZhciBGYWN0b3J5ID0ge307XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcblxuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdGhpcy51dWlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlc291cmNlcyA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMudXVpZCk7XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgICAgIHRoaXMuX3NldChrZXksIHZhbCwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy51bnNldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB0aGlzLl91bnNldChrZXksIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF0dHJpYnV0ZXMpKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChkZWZhdWx0cyhvcHRzLCB0aGlzLmRlZmF1bHRzKSk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplJywgdGhpcywgb3B0cyk7XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3NldCA9IGZ1bmN0aW9uKGtleSwgdmFsLCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldChrLCBrZXlba10sIGF0dHJpYnV0ZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHZhbDtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IHZhbDtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2UnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZTonICsga2V5LCB0aGlzLCB2YWwpO1xuICAgIH1cbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fZ2V0ID0gZnVuY3Rpb24oa2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzW2tleV07XG4gICAgfSAgZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLl91bnNldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHJldFtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICBkZWxldGUgYXR0cmlidXRlc1trZXldO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2RlbGV0ZScsIHRoaXMsIHJldCk7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnZGVsZXRlOicgKyBrZXksIHRoaXMsIHJldFtrZXldKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgdGhpcy5fdW5zZXQoaywgYXR0cmlidXRlcyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uKHJlc291cmNlLCBpZCkge1xuICAgIHRoaXMucmVzb3VyY2VzW3Jlc291cmNlXSA9IHJlc291cmNlO1xuXG4gICAgcmVzb3VyY2UuZXZlbnRCdXMuc3Vic2NyaWJlKCdjaGFuZ2U6JyArIGlkLCBmdW5jdGlvbihjdHgsIGF0dHJzKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cnMpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGssIGF0dHJzW2tdKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXNvdXJjZS5ldmVudEJ1cy5zdWJzY3JpYmUoJ2RlbGV0ZTonICsgaWQsIGZ1bmN0aW9uKGN0eCwgYXR0cnMpIHtcbiAgICAgICAgdGhpcy51bnNldCgpO1xuICAgIH0uYmluZCh0aGlzKSlcbn07XG5cbkZhY3RvcnkuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY3Rvcnk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBjb3VudCA9IDE7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IHN0ciArIGNvdW50O1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxufTtcblxuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG5cbiAgICBpZiAob3B0cy5lbmNvZGUpIHtcbiAgICAgICAgb3B0cy51cmwgKz0gZW5jb2RlVVJJKG9wdHMuZW5jb2RlKG9wdHMucGF5bG9hZCkpO1xuICAgIH1cblxuICAgIHhoci5vcGVuKG9wdHMudHlwZS50b1VwcGVyQ2FzZSgpLCBvcHRzLnVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIG9wdHMuY29udGVudFR5cGUpO1xuXG4gICAgZm9yICh2YXIgaGVhZGVyIGluIG9wdHMuaGVhZGVycykge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIG9wdHMuaGVhZGVyc1toZWFkZXJdKTtcbiAgICB9XG5cbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAgICAgdm93LnJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2b3cucmVqZWN0KHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5jb2RlKSB7XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkob3B0cy5wYXlsb2FkKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZvdy5wcm9taXNlO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmosIGRlZmF1bHRzKSB7XG4gICAgZGVmYXVsdHMgPSBkZWZhdWx0cyB8fCB7fTtcbiAgICBcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgaWYgKCFvYmpba2V5XSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBkZWZhdWx0c1trZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBlbmNvZGVkU3RyaW5nID0gJyc7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgaWYgKGVuY29kZWRTdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGVuY29kZWRTdHJpbmcgKz0gJyYnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5jb2RlZFN0cmluZyArPSBlbmNvZGVVUkkocHJvcCArICc9JyArIG9iamVjdFtwcm9wXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZWRTdHJpbmc7XG59IiwidmFyIEZhY3RvcnkgPSByZXF1aXJlKCcuL2ZhY3RvcnkvZmFjdG9yeScpO1xudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuL3NlcnZpY2Uvc2VydmljZScpO1xudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vY29tcG9uZW50L2NvbXBvbmVudCcpO1xudmFyIFN0eWxpemVyID0gcmVxdWlyZSgnLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4vbW9kdWxlL21vZHVsZScpO1xudmFyIFJlc291cmNlID0gcmVxdWlyZSgnLi9yZXNvdXJjZS9yZXNvdXJjZScpO1xudmFyIFJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJlci9yZW5kZXJlcicpO1xudmFyIFZvdyA9IHJlcXVpcmUoJy4vdm93L3ZvdycpO1xuXG52YXIgZ0V2ZW50QnVzID0gbmV3IEV2ZW50QnVzKCk7O1xuXG52YXIgVHJpbyA9IHtcbiAgICBGYWN0b3J5OiBGYWN0b3J5LFxuICAgIFNlcnZpY2U6IFNlcnZpY2UsXG4gICAgQ29tcG9uZW50OiBDb21wb25lbnQsXG4gICAgVm93OiBWb3csXG4gICAgU3R5bGl6ZXI6IG5ldyBTdHlsaXplcigpLFxuICAgIFJlbmRlcmVyOiBuZXcgUmVuZGVyZXIoKSxcbiAgICBNb2R1bGU6IG5ldyBNb2R1bGUoKSxcbiAgICBSZXNvdXJjZTogbmV3IFJlc291cmNlKClcbn1cblxuVHJpby5yZWdpc3Rlckdsb2JhbEV2ZW50QnVzID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gZ0V2ZW50QnVzLnJlZ2lzdGVyKGlkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJpbztcbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG52YXIgbW9kdWxlU3RvcmUgPSB7fTtcblxudmFyIE1vZHVsZSA9IGZ1bmN0aW9uKCkge1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICBkb25lKGZ1bmMoKSk7XG4gICAgfTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgIHZhciBsb2FkZWQgPSAwO1xuICAgIHZhciBjb3VudCAgPSBPYmplY3Qua2V5cyhtb2R1bGVzKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG4gICAgdmFyIHJldCA9IHt9O1xuICAgIHZhciB1cmw7XG5cbiAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcblxuICAgIHZvdy5wcm9taXNlLmFuZCA9IHt9O1xuICAgIHZvdy5wcm9taXNlLmFuZC5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgICAgICAgIHZvdy5wcm9taXNlXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jLmJpbmQodGhpcywgcmV0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgICAgICAgICAuZG9uZShkb25lKTtcbiAgICAgICAgfTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB2b3cucHJvbWlzZS5hbmQuaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgICAgICByZXR1cm4gdm93LnByb21pc2UudGhlbih0aGlzLmltcG9ydC5iaW5kKHRoaXMsIG1vZHVsZXMpKTtcbiAgICB9LmJpbmQodGhpcylcblxuICAgIHJldHVybiB2b3cucHJvbWlzZTtcblxuICAgIGZ1bmN0aW9uIF9pbXBvcnQoa2V5KSB7XG4gICAgICAgIHZhciB1cmwgPSBtb2R1bGVzW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZVN0b3JlW2tleV07XG4gICAgICAgIFxuICAgICAgICBpZiAoIW1vZHVsZSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICAgICAgICBzY3JpcHQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gICAgICAgICAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlciA9IFZvdygpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgJyArIGtleSArICcuLi4nKTtcblxuICAgICAgICAgICAgICAgIGRlZmVyLnByb21pc2UudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFtrZXldID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdy5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2NyaXB0LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0oZGVmZXIucmVzb2x2ZSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcywga2V5KTtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm93LnJlc29sdmUobW9kdWxlKCkpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCJ2YXIgUmVuZGVyZXIgPSBmdW5jdGlvbigpe1xuXG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUuY3JlYXRlVGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRlbXBsYXRlKCk7XG59O1xuXG52YXIgVGVtcGxhdGUgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuX2N1cnJlbnRTdGF0ZSA9IFtdO1xuICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgdGhpcy5fY29uZGl0aW9uYWwgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc3RhdGU7XG4gICAgdGhpcy5fbG9vcDtcbiAgICB0aGlzLl9zdGFydDtcblxufTtcblxuLyoqXG4gKiBDcmVhdGUgRE9NIG5vZGVcbiAqIEBwYXJhbSAge3N0cmluZ30gdGFnTmFtZSBFbGVtZW50IG5hbWVcbiAqIEByZXR1cm4ge2luc3RhbmNlfSAgICAgICB0aGlzXG4gKi9cblRlbXBsYXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbih0YWdOYW1lKXtcbiAgICB0YWdOYW1lID0gcGFyc2VUYWcodGFnTmFtZSk7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZVswXSk7XG4gICAgICAgIGlmICh0YWdOYW1lWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHRhZ05hbWVbMl07XG4gICAgICAgIH0gZWxzZSBpZiAodGFnTmFtZVsxXSA9PT0gJyMnKSB7XG4gICAgICAgICAgICBlbC5pZCA9IHRhZ05hbWVbMl07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY3VycmVudFN0YXRlLnB1c2goZWwpO1xuICAgIH0uYmluZCh0aGlzKVxuICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnb3BlbicsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVGVtcGxhdGUucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZWwgPSBncmFiTGFzdC5jYWxsKHRoaXMpO1xuICAgICAgICBjbGFzc05hbWUgPSBldmFsdWF0ZShkLCBjbGFzc05hbWUpO1xuICAgICAgICB2YXIgc2VwYXJhdG9yID0gZWwuY2xhc3NOYW1lLmxlbmd0aCA+IDAgPyAnICcgOiAnJztcbiAgICAgICAgaWYgKCFoYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgKz0gc2VwYXJhdG9yICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnYWRkQ2xhc3MnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS50ZXh0ID0gZnVuY3Rpb24oY29udGVudCkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGVsID0gZ3JhYkxhc3QuY2FsbCh0aGlzKTtcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBldmFsdWF0ZShkLCBjb250ZW50KTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5fcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5UZW1wbGF0ZS5wcm90b3R5cGUuYXR0ciA9IGZ1bmN0aW9uKGF0dHIsIHZhbCkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGVsID0gZ3JhYkxhc3QuY2FsbCh0aGlzKTtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGV2YWx1YXRlKGQsIGF0dHIpLCBldmFsdWF0ZShkLCB2YWwpKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5fcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdhdHRyJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5UZW1wbGF0ZS5wcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihhdHRyLCB2YWwpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBlbCA9IGdyYWJMYXN0LmNhbGwodGhpcyk7XG4gICAgICAgIGVsLnN0eWxlW2V2YWx1YXRlKGQsIGF0dHIpXSA9IGV2YWx1YXRlKGQsIHZhbCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnc3R5bGUnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGVsID0gZ3JhYkxhc3QuY2FsbCh0aGlzKTtcbiAgICAgICAgY2xhc3NOYW1lID0gZXZhbHVhdGUoZCwgY2xhc3NOYW1lKTtcbiAgICAgICAgaWYgKGhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZWcsJyAnKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3JlbW92ZUNsYXNzJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5UZW1wbGF0ZS5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLl9jdXJyZW50U3RhdGUucG9wKCk7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50U3RhdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzRnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGdyYWJMYXN0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5hcHBlbmRMYXN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBlbCA9IHRoaXMuX2N1cnJlbnRTdGF0ZS5wb3AoKTtcbiAgICAgIHRoaXMucHJldmlvdXNGcmFnbWVudC5hcHBlbmRDaGlsZChlbCk7XG4gIH0uYmluZCh0aGlzKTtcbiAgdGhpcy5fcXVldWUucHVzaCh7XG4gICAgICB0eXBlOiAnZW5kJyxcbiAgICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHRoaXM7ICBcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5pZiA9IGZ1bmN0aW9uKGZ1bmNPcktleSkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSAnY29uZGl0aW9uYWwnO1xuICAgICAgICBmdW5jT3JLZXkgPSBldmFsdWF0ZShkLCBmdW5jT3JLZXkpO1xuICAgICAgICB0aGlzLl9jb25kaXRpb25hbCA9ICEhZnVuY09yS2V5O1xuICAgIH0uYmluZCh0aGlzKVxuICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnaWYnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVGVtcGxhdGUucHJvdG90eXBlLmVsc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkKSB7XG4gICAgICAgIHRoaXMuX2NvbmRpdGlvbmFsID0gIXRoaXMuX2NvbmRpdGlvbmFsO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2Vsc2UnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVGVtcGxhdGUucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbihmdW5jT3JLZXkpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHRoaXMuX2xvb3AgID0gZXZhbHVhdGUoZCwgZnVuY09yS2V5KTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSAnbG9vcCc7XG4gICAgICAgIHRoaXMuX3N0YXJ0ID0gaTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5fcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdlYWNoJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblRlbXBsYXRlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB0aGlzLl9jb25kaXRpb25hbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fc3RhdGUgICAgICAgPSB1bmRlZmluZWQ7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnZG9uZScsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5UZW1wbGF0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMucHJldmlvdXNGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB0aGlzLl9xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHEsIGkpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLl9zdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSAnY29uZGl0aW9uYWwnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jb25kaXRpb25hbCB8fCBxLnR5cGUgPT09ICdlbHNlJyB8fCBxLnR5cGUgPT09ICdkb25lJykge1xuICAgICAgICAgICAgICAgICAgICBxLmZuKGRhdGEsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xvb3AnOlxuICAgICAgICAgICAgICAgIGlmIChxLnR5cGUgPT09ICdkb25lJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb29wLmZvckVhY2goZnVuY3Rpb24obCwgaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgc3RhcnQgPSB0aGlzLl9zdGFydCArIDE7IHN0YXJ0IDwgaTsgc3RhcnQrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb29wRm4gPSB0aGlzLl9xdWV1ZVtzdGFydF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcEZuLmZuKGwsIGopO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgICAgICBxLmZuKGRhdGEsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcS5mbihkYXRhLCBpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4gdGhpcy5wcmV2aW91c0ZyYWdtZW50O1xufTtcblxuZnVuY3Rpb24gZ3JhYkxhc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRTdGF0ZVt0aGlzLl9jdXJyZW50U3RhdGUubGVuZ3RoIC0gMV07XG59O1xuXG5mdW5jdGlvbiBoYXNDbGFzcyhlbCwgY2xhc3NOYW1lKSB7XG4gIHJldHVybiAhIWVsLmNsYXNzTmFtZS5tYXRjaChuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJykpO1xufTtcblxuZnVuY3Rpb24gcGFyc2VUYWcodGFnKSB7XG4gICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAuc3BsaXQoJywnKTtcbiAgICByZXR1cm4gdGFnO1xufTtcblxuZnVuY3Rpb24gZXZhbHVhdGUoZGF0YSwgZnVuY09yU3RyaW5nKSB7XG4gICAgc3dpdGNoICh0eXBlb2YgZnVuY09yU3RyaW5nKSB7XG4gICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgIHJldHVybiBmdW5jT3JTdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmNPclN0cmluZztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG52YXIgRmFjdG9yeSA9IHJlcXVpcmUoJy4uL2ZhY3RvcnkvZmFjdG9yeScpO1xudmFyIGFqYXggPSByZXF1aXJlKCcuLi9oZWxwZXJzL2FqYXgnKTtcbnZhciBwYXJhbSA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvcGFyYW0nKTtcbnZhciBEYXRhID0gRmFjdG9yeS5leHRlbmQoe1xuICAgIGFqYXg6IGZ1bmN0aW9uKG9wdHMpe1xuICAgICAgICBpZiAoIW9wdHMudXJsKSB0aHJvdyBuZXcgRXJyb3IoJ1VybCBpcyByZXF1aXJlZC4nKTtcbiAgICAgICAgaWYgKCFvcHRzLnR5cGUpIHRocm93IG5ldyBFcnJvcignUmVxdWVzdCB0eXBlIGlzIHJlcXVpcmVkLicpO1xuXG4gICAgICAgIG9wdHMuY29udGVudFR5cGUgPSBvcHRzLmNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgb3B0cy5lbmNvZGUgICAgICA9IG9wdHMuZW5jb2RlIHx8IG51bGw7XG4gICAgICAgIG9wdHMucGF5bG9hZCAgICAgPSBvcHRzLnBheWxvYWQgfHwgbnVsbDtcbiAgICAgICAgb3B0cy5pbmRleEJ5ICAgICA9IG9wdHMuaW5kZXhCeSB8fCAnaWQnO1xuXG4gICAgICAgIHJldHVybiBhamF4KG9wdHMpXG4gICAgICAgICAgICAgICAgLnRoZW4oX3BhcnNlLmJpbmQodGhpcykpXG4gICAgICAgICAgICAgICAgLnRoZW4oX3VwZGF0ZVN0b3JlLmJpbmQodGhpcykpO1xuXG4gICAgICAgIGZ1bmN0aW9uIF91cGRhdGVTdG9yZShyc3ApIHtcbiAgICAgICAgICAgIGlmIChvcHRzLnR5cGUudG9VcHBlckNhc2UoKSA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyc3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIHJzcC5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW5zZXQoZFtvcHRzLmluZGV4QnldLCBkKTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByc3AgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudW5zZXQocnNwW29wdHMuaW5kZXhCeV0sIHJzcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyc3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIHJzcC5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KGRbb3B0cy5pbmRleEJ5XSwgZCk7XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnNwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChyc3Bbb3B0cy5pbmRleEJ5XSwgcnNwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnNwO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlKHJzcCkge1xuICAgICAgICAgICAgaWYgKG9wdHMucGFyc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5wYXJzZShyc3ApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlKHJzcCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHJzcCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShyc3ApO1xuICAgIH1cbn0pO1xuXG52YXIgZGF0YXN0b3JlID0ge307XG52YXIgUmVzb3VyY2UgPSBmdW5jdGlvbigpIHtcbn07XG5cblJlc291cmNlLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAoZGF0YXN0b3JlW25hbWVdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVzb3VyY2UgJyArIG5hbWUgKyAnIGFscmVhZHkgZXhpc3QuJyk7XG4gICAgfVxuXG4gICAgZGF0YXN0b3JlW25hbWVdID0gbmV3IERhdGEoKTtcbiAgICByZXR1cm4gZGF0YXN0b3JlW25hbWVdO1xufTtcblxuUmVzb3VyY2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gZGF0YXN0b3JlW25hbWVdID8gZGF0YXN0b3JlW25hbWVdIDogdGhpcy5yZWdpc3RlcihuYW1lKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXNvdXJjZTtcbiIsInZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnc2VydmljZScpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG5cbnZhciBTZXJ2aWNlID0ge307XG5cblNlcnZpY2UuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5TZXJ2aWNlLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy51dWlkID0gSWRHZW5lcmF0b3IoKTtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblNlcnZpY2UuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbih0YXJnZXQsIGV2ZW50cykge1xuICAgIGZvciAodmFyIGV2dCBpbiBldmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBldmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0YXJnZXQuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cblNlcnZpY2UuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7IiwidmFyIG1peGlucyA9IHt9O1xudmFyIHZhcmlhYmxlcyA9IHt9O1xuXG52YXIgU3R5bGl6ZXIgPSBmdW5jdGlvbigpIHtcblxufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIHJldCA9ICcnO1xuXG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gc3R5bGUpIHtcbiAgICAgICAgcmV0ICs9IHNlbGVjdG9yICsgJ3snO1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IHN0eWxlW3NlbGVjdG9yXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZyA9IHByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICByZXQgKz0gcHJvcCArICc6JyArIHNldHRpbmcgKyAnOyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gcmV0LnNsaWNlKDAsIHJldC5sZW5ndGggLSAxKTtcbiAgICAgICAgcmV0ICs9ICd9JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmNyZWF0ZVN0eWxlVGFnID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgICB2YXIgdGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZSA9IHRoaXMuc3RyaW5naWZ5KHN0eWxlKTtcbiAgICB0YWcuaW5uZXJUZXh0ID0gc3R5bGU7XG4gICAgcmV0dXJuIHRhZztcbn1cblxuU3R5bGl6ZXIucHJvdG90eXBlLnJlZ2lzdGVyTWl4aW5zID0gZnVuY3Rpb24oa2V5LCBmdW5jKSB7XG4gICAgbWl4aW5zW2tleV0gPSBmdW5jO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLnJlZ2lzdGVyVmFyaWFibGVzID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICB2YXJpYWJsZXNba2V5XSA9IHZhbDtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5nZXRWYXJpYWJsZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICghdmFyaWFibGVzW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVmFyaWFibGUgJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHZhcmlhYmxlc1trZXldO1xufTtcblxuU3R5bGl6ZXIucHJvdG90eXBlLmdldE1peGlucyA9IGZ1bmN0aW9uKGtleSwgb3B0cykge1xuICAgIGlmICghbWl4aW5zW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTWl4aW4gJyArIGtleSArICcgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIG1peGluc1trZXldLmNhbGwodGhpcywgb3B0cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxpemVyOyIsInZhciBMaW5rZWRMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB0aGlzLnRhaWwgPSBudWxsO1xufTtcblxuTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkVG9UYWlsID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgdGljayA9IHtcbiAgICAgICAgZnVuYzogZm4sXG4gICAgICAgIG5leHQ6IG51bGxcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhZCkge1xuICAgICAgICB0aGlzLmhlYWQgPSB0aWNrO1xuICAgICAgICB0aGlzLmhlYWQubmV4dCA9IHRoaXMudGFpbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YWlsKSB7XG4gICAgICAgIHRoaXMudGFpbC5uZXh0ID0gdGljaztcbiAgICB9XG4gICAgXG4gICAgdGhpcy50YWlsID0gdGljaztcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLnJlbW92ZUhlYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJldmlvdXNIZWFkO1xuXG4gICAgaWYgKHRoaXMuaGVhZCkge1xuICAgICAgICBwcmV2aW91c0hlYWQgPSB0aGlzLmhlYWQuZnVuYztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWFkLm5leHQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGhpcy5oZWFkLm5leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50YWlsID0gbnVsbDtcbiAgICAgICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlvdXNIZWFkO1xufTtcblxudmFyIFBFTkRJTkcgID0ge30sXG4gICAgUkVTT0xWRUQgPSB7fSxcbiAgICBSRUpFQ1RFRCA9IHt9OyBcblxudmFyIFZvdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2b3cgPSB7fTtcblxuICAgIHZhciBzdGF0dXMgICAgICAgPSBQRU5ESU5HO1xuICAgIHZhciByZXNvbHZlVGlja3MgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciByZWplY3RUaWNrcyAgPSBuZXcgTGlua2VkTGlzdCgpO1xuICAgIHZhciBkb25lVGljaywgZXhjZXB0aW9uLCB2YWwsIGZuO1xuXG4gICAgdm93LnJlc29sdmUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVKRUNURUQgfHwgIXJlc29sdmVUaWNrcy5oZWFkKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlRG9uZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdHVzID0gUkVTT0xWRUQ7XG4gICAgICAgICAgICB2YWwgPSByZXQ7XG5cbiAgICAgICAgICAgIGZuID0gcmVzb2x2ZVRpY2tzLnJlbW92ZUhlYWQoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YWwgPSBmbi5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gUkVKRUNURUQ7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgICAgICB2b3cucmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHZhbCAmJiB0eXBlb2YgdmFsLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB2YWwudGhlbih2b3cucmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3cucmVzb2x2ZSh2YWwpO1xuICAgICAgICB9LmJpbmQodGhpcyksIDApO1xuICAgIH07XG5cbiAgICB2b3cucmVqZWN0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSRVNPTFZFRCB8fCAhcmVqZWN0VGlja3MuaGVhZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcblxuICAgICAgICAgICAgZm4gPSByZWplY3RUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZXJyO1xuICAgICAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdy5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcblxuICAgIH07XG5cblxuICAgIHZvdy5wcm9taXNlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHt9XG5cbiAgICAgICAgcHJvbWlzZS50aGVuID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVzb2x2ZVRpY2tzLmFkZFRvVGFpbChmdW5jKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByb21pc2UuY2F0Y2ggPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICByZWplY3RUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmRvbmUgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICBkb25lVGljayA9IGZ1bmM7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cbiAgICB9KSgpO1xuXG4gICAgcmV0dXJuIHZvdztcbiAgICBcbiAgICBmdW5jdGlvbiBoYW5kbGVEb25lKCkge1xuICAgICAgICBpZiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRvbmVUaWNrKSB7XG4gICAgICAgICAgICBkb25lVGljay5jYWxsKHRoaXMsIHZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlVGlja3MgPSBudWxsO1xuICAgICAgICByZWplY3RUaWNrcyAgPSBudWxsO1xuICAgICAgICBkb25lVGljayAgICAgPSBudWxsO1xuICAgICAgICBleGNlcHRpb24gICAgPSBudWxsO1xuICAgICAgICB2YWwgICAgICAgICAgPSBudWxsO1xuICAgICAgICBmbiAgICAgICAgICAgPSBudWxsO1xuXG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVm93O1xuXG4iLCJ3aW5kb3cuVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTsiXX0=
