(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var EventBus = require('../eventBus/eventBus');
var IdGenerator = require('../helpers/IdGenerator')('component');
var extend = require('../helpers/extend');

var Component = {};

Component.register = function(opts) {
    var param = {};

    // Set Prototype of custom element
    var proto = Object.create(HTMLElement.prototype);

    _extendPrototype.call(proto, opts);

    proto.createdCallback = function() {
        var shadow = this.createShadowRoot();
        shadow.appendChild(opts.fragment);

        this.uuid = IdGenerator();

        if (opts.style) {
            shadow.appendChild(opts.style);
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
    document.registerElement(opts.tagName, param);
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

},{"../eventBus/eventBus":2,"../helpers/IdGenerator":4,"../helpers/extend":7}],2:[function(require,module,exports){
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

var _currentState = [];
var _queue = [];
var _conditional = undefined;
var _state;
var _loop;
var _start;
var Template = function(){};

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
        _currentState.push(el);
    }.bind(this)
    _queue.push({
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
    _queue.push({
        type: 'addClass',
        fn: fn
    });
    return this;
};

Template.prototype.text = function(content) {
    var fn = function(d) {
        var el = grabLast.call(this);
        el.textContent = content;
    }.bind(this);
    _queue.push({
        type: 'text',
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
    _queue.push({
        type: 'removeClass',
        fn: fn
    });
    return this;
};

Template.prototype.append = function() {
    var fn = function(d) {
        var el = _currentState.pop();
        if (_currentState.length === 0) {
            this.previousFragment.appendChild(el);
        } else {
            var parent = grabLast.call(this);
            parent.appendChild(el);
        }
    }.bind(this);
    _queue.push({
        type: 'close',
        fn: fn
    });
    return this;
};

Template.prototype.end = function() {
  var fn = function(d) {
      var el = _currentState.pop();
      this.previousFragment.appendChild(el);
  }.bind(this);
  _queue.push({
      type: 'end',
      fn: fn
  });
  return this;  
};

Template.prototype.if = function(funcOrKey) {
    var fn = function(d) {
        _state = 'conditional';
        funcOrKey = evaluate(d, funcOrKey);
        _conditional = !!funcOrKey;
    }.bind(this)
    _queue.push({
        type: 'if',
        fn: fn
    });
    return this;
}

Template.prototype.else = function() {
    var fn = function(d) {
        _conditional = !_conditional;
    }.bind(this);
    _queue.push({
        type: 'else',
        fn: fn
    });
    return this;
}

Template.prototype.each = function(funcOrKey) {
    var fn = function(d, i) {
        funcOrKey = evaluate(d, funcOrKey);
        _loop  = funcOrKey;
        _state = 'loop';
        _start = i;
    }.bind(this);
    _queue.push({
        type: 'each',
        fn: fn
    });
    return this;
}

Template.prototype.done = function() {
    var fn = function(d, i) {
        _conditional = undefined;
        _state       = undefined;
    }.bind(this);
    _queue.push({
        type: 'done',
        fn: fn
    });
    return this;
}

Template.prototype.render = function(data) {
    this.previousFragment = document.createDocumentFragment();
    _queue.forEach(function(q, i) {
        switch (_state) {
            case 'conditional':
                if (_conditional || q.type === 'else' || q.type === 'done') {
                    q.fn(data, i);
                }
                break;
            case 'loop':
                if (q.type === 'done') {
                    _loop.forEach(function(l, j) {
                        for (var start = _start + 1; start < i; start++) {
                            var loopFn = _queue[start];
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
    return _currentState[_currentState.length - 1];
};

function hasClass(el, className) {
  return !!el.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'));
};

function parseTag(tag) {
    tag = tag.replace(/[.#]/, function(d) { return ',' + d + ','})
             .split(',');
    return tag;
};

function evaluate(data, funcOrKey) {
    switch (typeof funcOrKey) {
        case 'function':
            return funcOrKey.apply(this, arguments);
            break;
        case 'string':
            var keys = funcOrKey.split('.');
            var ans = data;
            keys.forEach(function(key, i) {
                ans = data[key];
            });
            return ans;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi9UcmluaXR5SlMvc3JjL2V2ZW50QnVzL2V2ZW50QnVzLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9mYWN0b3J5L2ZhY3RvcnkuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvYWpheC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9kZWZhdWx0cy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9leHRlbmQuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvcGFyYW0uanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2R1bGUvbW9kdWxlLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9yZW5kZXJlci9yZW5kZXJlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvcmVzb3VyY2UvcmVzb3VyY2UuanMiLCIuLi9UcmluaXR5SlMvc3JjL3NlcnZpY2Uvc2VydmljZS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3Zvdy92b3cuanMiLCJjbGllbnQvc3JjL2xpYi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2NvbXBvbmVudCcpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG5cbnZhciBDb21wb25lbnQgPSB7fTtcblxuQ29tcG9uZW50LnJlZ2lzdGVyID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciBwYXJhbSA9IHt9O1xuXG4gICAgLy8gU2V0IFByb3RvdHlwZSBvZiBjdXN0b20gZWxlbWVudFxuICAgIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcblxuICAgIF9leHRlbmRQcm90b3R5cGUuY2FsbChwcm90bywgb3B0cyk7XG5cbiAgICBwcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNoYWRvdyA9IHRoaXMuY3JlYXRlU2hhZG93Um9vdCgpO1xuICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQob3B0cy5mcmFnbWVudCk7XG5cbiAgICAgICAgdGhpcy51dWlkID0gSWRHZW5lcmF0b3IoKTtcblxuICAgICAgICBpZiAob3B0cy5zdHlsZSkge1xuICAgICAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKG9wdHMuc3R5bGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRzLm9uQ3JlYXRlKSB7XG4gICAgICAgICAgICBvcHRzLm9uQ3JlYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG8uYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAob3B0cy5vbkF0dGFjaCkge1xuICAgICAgICAgICAgb3B0cy5vbkF0dGFjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIF9hZGRFdmVudExpc3RlbmVycy5jYWxsKHRoaXMsIG9wdHMuZXZlbnRzKTtcbiAgICB9XG5cbiAgICBwcm90by5kZXRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChvcHRzLm9uRGV0YWNoKSB7XG4gICAgICAgICAgICBvcHRzLm9uRGV0YWNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90by5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgPSBmdW5jdGlvbihhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpIHtcbiAgICAgICAgaWYgKG9wdHMub25BdHRyaWJ1dGVzQ2hhbmdlKSB7XG4gICAgICAgICAgICBvcHRzLm9uQXR0cmlidXRlc0NoYW5nZVthdHRyTmFtZV0uYXBwbHkodGhpcywgW29sZFZhbCwgbmV3VmFsXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJhbS5wcm90b3R5cGUgPSBwcm90bztcblxuICAgIC8vIFNldCBiYXNlIGVsZW1lbnQgKE9wdGlvbmFsKVxuICAgIGlmIChvcHRzLmV4dGVuZHMpIHtcbiAgICAgICAgcGFyYW0uZXh0ZW5kcyA9IG9wdHMuZXh0ZW5kcztcbiAgICB9XG5cbiAgICAvLyBSZWdpc3RlciBjdXN0b20gZWxlbWVudFxuICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChvcHRzLnRhZ05hbWUsIHBhcmFtKTtcbn07XG5cbmZ1bmN0aW9uIF9hZGRFdmVudExpc3RlbmVycyhldmVudHMpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHZhciBwYXJhbSA9IGV2dC5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgZXZlbnROYW1lID0gcGFyYW1bMF07XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3IocGFyYW1bMV0pO1xuICAgICAgICB2YXIgaGFuZGxlciA9IGV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIFxuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfZXh0ZW5kUHJvdG90eXBlKHByb3Rvcykge1xuICAgIGZvciAodmFyIHByb3RvIGluIHByb3Rvcykge1xuICAgICAgICBzd2l0Y2ggKHByb3RvKSB7XG4gICAgICAgICAgICBjYXNlICdleGVuZHMnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25DcmVhdGUnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25EZXRhY2gnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb25BdHRyaWJ1dGVzQ2hhbmdlJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29uQXR0YWNoJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RhZ05hbWUnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZnJhZ21lbnQnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3R5bGUnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXZlbnRzJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpc1twcm90b10gPSBwcm90b3NbcHJvdG9dO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbiIsInZhciBFdmVudEJ1cyA9IGZ1bmN0aW9uKCkge1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgaWQgPSBpZDtcbiAgICB2YXIgZXZlbnRzID0ge307XG4gICAgcmV0dXJuIChmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICAgIHZhciBldnQgPSB7fVxuICAgICAgICBldnQuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3N1YnNjcmliZShldmVudCwgZnVuYywgaWQsIGV2ZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIGV2dC5wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncykge1xuICAgICAgICAgICAgY29udGV4dC5fcHVibGlzaChldmVudCwgY3R4LCBhcmdzLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICAgICAgY29udGV4dC5fdW5zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgY29udGV4dC5fdW5zdWJzY3JpYmVBbGwoZXZlbnQsIGlkLCBldmVudHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBldnQ7XG4gICAgfSkodGhpcyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3N1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgaWYgKCFldmVudHNbZXZlbnRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF0gPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50c1tldmVudF1baWRdKSB7XG4gICAgICAgIGV2ZW50c1tldmVudF1baWRdID0gW107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHBhc3NlZCBpbiB0byBzdWJzY3JpYmUnKTtcbiAgICB9XG4gICAgXG4gICAgZXZlbnRzW2V2ZW50XVtpZF0ucHVzaChmdW5jKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fcHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MsIGV2ZW50cykge1xuICAgIGN0eCA9IGN0eCB8fCBudWxsO1xuICAgIGFyZ3MgPSBhcmdzIHx8IG51bGw7XG5cbiAgICB2YXIgZXZlbnRCdWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGV2ZW50QnVja2V0KSB7XG4gICAgICAgIGZvciAodmFyIGJ1Y2tldCBpbiBldmVudEJ1Y2tldCkge1xuICAgICAgICAgICAgdmFyIGNiUXVldWUgPSBldmVudEJ1Y2tldFtidWNrZXRdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2JRdWV1ZSkpIHtcbiAgICAgICAgICAgICAgICBjYlF1ZXVlLmZvckVhY2goZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IuY2FsbCh0aGlzLCBjdHgsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl91bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGV2ZW50c1tldmVudF07XG5cbiAgICBpZiAoYnVja2V0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IGJ1Y2tldFtpZF07XG5cbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmbiwgaSkge1xuICAgICAgICAgICAgaWYoZm4gPT09IGZ1bmMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCwgaWQsIGV2ZW50cykge1xuICAgIGlmIChldmVudCkge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gXG5cbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHVuc3Vic3JpYmVPbmUoZXZ0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bnN1YnNyaWJlT25lKGV2ZW50KSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgICAgIGlmIChidWNrZXQgJiYgYnVja2V0W2lkXSkge1xuICAgICAgICAgICAgZGVsZXRlIGJ1Y2tldFtpZF07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50QnVzO1xuIiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnZmFjdG9yeScpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2RlZmF1bHRzJyk7XG5cbnZhciBGYWN0b3J5ID0ge307XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcblxuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdGhpcy51dWlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlc291cmNlcyA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMgPSB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMudXVpZCk7XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgICAgIHRoaXMuX3NldChrZXksIHZhbCwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy51bnNldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB0aGlzLl91bnNldChrZXksIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF0dHJpYnV0ZXMpKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChkZWZhdWx0cyhvcHRzLCB0aGlzLmRlZmF1bHRzKSk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplJywgdGhpcywgb3B0cyk7XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3NldCA9IGZ1bmN0aW9uKGtleSwgdmFsLCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldChrLCBrZXlba10sIGF0dHJpYnV0ZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHZhbDtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IHZhbDtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2UnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZTonICsga2V5LCB0aGlzLCB2YWwpO1xuICAgIH1cbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fZ2V0ID0gZnVuY3Rpb24oa2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzW2tleV07XG4gICAgfSAgZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLl91bnNldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHJldFtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICBkZWxldGUgYXR0cmlidXRlc1trZXldO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2RlbGV0ZScsIHRoaXMsIHJldCk7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnZGVsZXRlOicgKyBrZXksIHRoaXMsIHJldFtrZXldKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgdGhpcy5fdW5zZXQoaywgYXR0cmlidXRlcyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uKHJlc291cmNlLCBpZCkge1xuICAgIHRoaXMucmVzb3VyY2VzW3Jlc291cmNlXSA9IHJlc291cmNlO1xuXG4gICAgcmVzb3VyY2UuZXZlbnRCdXMuc3Vic2NyaWJlKCdjaGFuZ2U6JyArIGlkLCBmdW5jdGlvbihjdHgsIGF0dHJzKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cnMpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGssIGF0dHJzW2tdKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXNvdXJjZS5ldmVudEJ1cy5zdWJzY3JpYmUoJ2RlbGV0ZTonICsgaWQsIGZ1bmN0aW9uKGN0eCwgYXR0cnMpIHtcbiAgICAgICAgdGhpcy51bnNldCgpO1xuICAgIH0uYmluZCh0aGlzKSlcbn07XG5cbkZhY3RvcnkuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY3Rvcnk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBjb3VudCA9IDE7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IHN0ciArIGNvdW50O1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxufTtcblxuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG5cbiAgICBpZiAob3B0cy5lbmNvZGUpIHtcbiAgICAgICAgb3B0cy51cmwgKz0gZW5jb2RlVVJJKG9wdHMuZW5jb2RlKG9wdHMucGF5bG9hZCkpO1xuICAgIH1cblxuICAgIHhoci5vcGVuKG9wdHMudHlwZS50b1VwcGVyQ2FzZSgpLCBvcHRzLnVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIG9wdHMuY29udGVudFR5cGUpO1xuXG4gICAgZm9yICh2YXIgaGVhZGVyIGluIG9wdHMuaGVhZGVycykge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIG9wdHMuaGVhZGVyc1toZWFkZXJdKTtcbiAgICB9XG5cbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAgICAgdm93LnJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2b3cucmVqZWN0KHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5jb2RlKSB7XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkob3B0cy5wYXlsb2FkKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZvdy5wcm9taXNlO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmosIGRlZmF1bHRzKSB7XG4gICAgZGVmYXVsdHMgPSBkZWZhdWx0cyB8fCB7fTtcbiAgICBcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgaWYgKCFvYmpba2V5XSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBkZWZhdWx0c1trZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBlbmNvZGVkU3RyaW5nID0gJyc7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgaWYgKGVuY29kZWRTdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGVuY29kZWRTdHJpbmcgKz0gJyYnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5jb2RlZFN0cmluZyArPSBlbmNvZGVVUkkocHJvcCArICc9JyArIG9iamVjdFtwcm9wXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZWRTdHJpbmc7XG59IiwidmFyIEZhY3RvcnkgPSByZXF1aXJlKCcuL2ZhY3RvcnkvZmFjdG9yeScpO1xudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuL3NlcnZpY2Uvc2VydmljZScpO1xudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vY29tcG9uZW50L2NvbXBvbmVudCcpO1xudmFyIFN0eWxpemVyID0gcmVxdWlyZSgnLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4vbW9kdWxlL21vZHVsZScpO1xudmFyIFJlc291cmNlID0gcmVxdWlyZSgnLi9yZXNvdXJjZS9yZXNvdXJjZScpO1xudmFyIFJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJlci9yZW5kZXJlcicpO1xudmFyIFZvdyA9IHJlcXVpcmUoJy4vdm93L3ZvdycpO1xuXG52YXIgZ0V2ZW50QnVzID0gbmV3IEV2ZW50QnVzKCk7O1xuXG52YXIgVHJpbyA9IHtcbiAgICBGYWN0b3J5OiBGYWN0b3J5LFxuICAgIFNlcnZpY2U6IFNlcnZpY2UsXG4gICAgQ29tcG9uZW50OiBDb21wb25lbnQsXG4gICAgVm93OiBWb3csXG4gICAgU3R5bGl6ZXI6IG5ldyBTdHlsaXplcigpLFxuICAgIFJlbmRlcmVyOiBuZXcgUmVuZGVyZXIoKSxcbiAgICBNb2R1bGU6IG5ldyBNb2R1bGUoKSxcbiAgICBSZXNvdXJjZTogbmV3IFJlc291cmNlKClcbn1cblxuVHJpby5yZWdpc3Rlckdsb2JhbEV2ZW50QnVzID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gZ0V2ZW50QnVzLnJlZ2lzdGVyKGlkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJpbztcbiIsInZhciBWb3cgPSByZXF1aXJlKCcuLi92b3cvdm93Jyk7XG52YXIgbW9kdWxlU3RvcmUgPSB7fTtcblxudmFyIE1vZHVsZSA9IGZ1bmN0aW9uKCkge1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICBkb25lKGZ1bmMoKSk7XG4gICAgfTtcbn07XG5cbk1vZHVsZS5wcm90b3R5cGUuaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgIHZhciBsb2FkZWQgPSAwO1xuICAgIHZhciBjb3VudCAgPSBPYmplY3Qua2V5cyhtb2R1bGVzKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG4gICAgdmFyIHJldCA9IHt9O1xuICAgIHZhciB1cmw7XG5cbiAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcblxuICAgIHZvdy5wcm9taXNlLmFuZCA9IHt9O1xuICAgIHZvdy5wcm9taXNlLmFuZC5leHBvcnQgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgICAgICAgIHZvdy5wcm9taXNlXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jLmJpbmQodGhpcywgcmV0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgICAgICAgICAuZG9uZShkb25lKTtcbiAgICAgICAgfTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB2b3cucHJvbWlzZS5hbmQuaW1wb3J0ID0gZnVuY3Rpb24obW9kdWxlcykge1xuICAgICAgICByZXR1cm4gdm93LnByb21pc2UudGhlbih0aGlzLmltcG9ydC5iaW5kKHRoaXMsIG1vZHVsZXMpKTtcbiAgICB9LmJpbmQodGhpcylcblxuICAgIHJldHVybiB2b3cucHJvbWlzZTtcblxuICAgIGZ1bmN0aW9uIF9pbXBvcnQoa2V5KSB7XG4gICAgICAgIHZhciB1cmwgPSBtb2R1bGVzW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZVN0b3JlW2tleV07XG4gICAgICAgIFxuICAgICAgICBpZiAoIW1vZHVsZSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICAgICAgICBzY3JpcHQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gICAgICAgICAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlciA9IFZvdygpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgJyArIGtleSArICcuLi4nKTtcblxuICAgICAgICAgICAgICAgIGRlZmVyLnByb21pc2UudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldFtrZXldID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdy5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1wb3J0KGNvdW50LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2NyaXB0LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVN0b3JlW2tleV0oZGVmZXIucmVzb2x2ZSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcywga2V5KTtcblxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm93LnJlc29sdmUobW9kdWxlKCkpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCJ2YXIgUmVuZGVyZXIgPSBmdW5jdGlvbigpe1xuXG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUuY3JlYXRlVGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRlbXBsYXRlKCk7XG59O1xuXG52YXIgX2N1cnJlbnRTdGF0ZSA9IFtdO1xudmFyIF9xdWV1ZSA9IFtdO1xudmFyIF9jb25kaXRpb25hbCA9IHVuZGVmaW5lZDtcbnZhciBfc3RhdGU7XG52YXIgX2xvb3A7XG52YXIgX3N0YXJ0O1xudmFyIFRlbXBsYXRlID0gZnVuY3Rpb24oKXt9O1xuXG4vKipcbiAqIENyZWF0ZSBET00gbm9kZVxuICogQHBhcmFtICB7c3RyaW5nfSB0YWdOYW1lIEVsZW1lbnQgbmFtZVxuICogQHJldHVybiB7aW5zdGFuY2V9ICAgICAgIHRoaXNcbiAqL1xuVGVtcGxhdGUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKHRhZ05hbWUpe1xuICAgIHRhZ05hbWUgPSBwYXJzZVRhZyh0YWdOYW1lKTtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lWzBdKTtcbiAgICAgICAgaWYgKHRhZ05hbWVbMV0gPT09ICcuJykge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gdGFnTmFtZVsyXTtcbiAgICAgICAgfSBlbHNlIGlmICh0YWdOYW1lWzFdID09PSAnIycpIHtcbiAgICAgICAgICAgIGVsLmlkID0gdGFnTmFtZVsyXTtcbiAgICAgICAgfVxuICAgICAgICBfY3VycmVudFN0YXRlLnB1c2goZWwpO1xuICAgIH0uYmluZCh0aGlzKVxuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ29wZW4nLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGVsID0gZ3JhYkxhc3QuY2FsbCh0aGlzKTtcbiAgICAgICAgY2xhc3NOYW1lID0gZXZhbHVhdGUoZCwgY2xhc3NOYW1lKTtcbiAgICAgICAgdmFyIHNlcGFyYXRvciA9IGVsLmNsYXNzTmFtZS5sZW5ndGggPiAwID8gJyAnIDogJyc7XG4gICAgICAgIGlmICghaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lICs9IHNlcGFyYXRvciArIGNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcbiAgICBfcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdhZGRDbGFzcycsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVGVtcGxhdGUucHJvdG90eXBlLnRleHQgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZWwgPSBncmFiTGFzdC5jYWxsKHRoaXMpO1xuICAgICAgICBlbC50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGVsID0gZ3JhYkxhc3QuY2FsbCh0aGlzKTtcbiAgICAgICAgY2xhc3NOYW1lID0gZXZhbHVhdGUoZCwgY2xhc3NOYW1lKTtcbiAgICAgICAgaWYgKGhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZWcsJyAnKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcbiAgICBfcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdyZW1vdmVDbGFzcycsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVGVtcGxhdGUucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGVsID0gX2N1cnJlbnRTdGF0ZS5wb3AoKTtcbiAgICAgICAgaWYgKF9jdXJyZW50U3RhdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzRnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGdyYWJMYXN0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2Nsb3NlJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5UZW1wbGF0ZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBlbCA9IF9jdXJyZW50U3RhdGUucG9wKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICB9LmJpbmQodGhpcyk7XG4gIF9xdWV1ZS5wdXNoKHtcbiAgICAgIHR5cGU6ICdlbmQnLFxuICAgICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gdGhpczsgIFxufTtcblxuVGVtcGxhdGUucHJvdG90eXBlLmlmID0gZnVuY3Rpb24oZnVuY09yS2V5KSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICBfc3RhdGUgPSAnY29uZGl0aW9uYWwnO1xuICAgICAgICBmdW5jT3JLZXkgPSBldmFsdWF0ZShkLCBmdW5jT3JLZXkpO1xuICAgICAgICBfY29uZGl0aW9uYWwgPSAhIWZ1bmNPcktleTtcbiAgICB9LmJpbmQodGhpcylcbiAgICBfcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdpZicsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5UZW1wbGF0ZS5wcm90b3R5cGUuZWxzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgX2NvbmRpdGlvbmFsID0gIV9jb25kaXRpb25hbDtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnZWxzZScsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5UZW1wbGF0ZS5wcm90b3R5cGUuZWFjaCA9IGZ1bmN0aW9uKGZ1bmNPcktleSkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgZnVuY09yS2V5ID0gZXZhbHVhdGUoZCwgZnVuY09yS2V5KTtcbiAgICAgICAgX2xvb3AgID0gZnVuY09yS2V5O1xuICAgICAgICBfc3RhdGUgPSAnbG9vcCc7XG4gICAgICAgIF9zdGFydCA9IGk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2VhY2gnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVGVtcGxhdGUucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIF9jb25kaXRpb25hbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgX3N0YXRlICAgICAgID0gdW5kZWZpbmVkO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICBfcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdkb25lJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblRlbXBsYXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy5wcmV2aW91c0ZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIF9xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKHEsIGkpIHtcbiAgICAgICAgc3dpdGNoIChfc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NvbmRpdGlvbmFsJzpcbiAgICAgICAgICAgICAgICBpZiAoX2NvbmRpdGlvbmFsIHx8IHEudHlwZSA9PT0gJ2Vsc2UnIHx8IHEudHlwZSA9PT0gJ2RvbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZm4oZGF0YSwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbG9vcCc6XG4gICAgICAgICAgICAgICAgaWYgKHEudHlwZSA9PT0gJ2RvbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIF9sb29wLmZvckVhY2goZnVuY3Rpb24obCwgaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgc3RhcnQgPSBfc3RhcnQgKyAxOyBzdGFydCA8IGk7IHN0YXJ0KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9vcEZuID0gX3F1ZXVlW3N0YXJ0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb29wRm4uZm4obCwgaik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgIHEuZm4oZGF0YSwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBxLmZuKGRhdGEsIGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHJldHVybiB0aGlzLnByZXZpb3VzRnJhZ21lbnQ7XG59O1xuXG5mdW5jdGlvbiBncmFiTGFzdCgpIHtcbiAgICByZXR1cm4gX2N1cnJlbnRTdGF0ZVtfY3VycmVudFN0YXRlLmxlbmd0aCAtIDFdO1xufTtcblxuZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIGNsYXNzTmFtZSkge1xuICByZXR1cm4gISFlbC5jbGFzc05hbWUubWF0Y2gobmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbGFzc05hbWUrJyhcXFxcc3wkKScpKTtcbn07XG5cbmZ1bmN0aW9uIHBhcnNlVGFnKHRhZykge1xuICAgIHRhZyA9IHRhZy5yZXBsYWNlKC9bLiNdLywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJywnICsgZCArICcsJ30pXG4gICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgcmV0dXJuIHRhZztcbn07XG5cbmZ1bmN0aW9uIGV2YWx1YXRlKGRhdGEsIGZ1bmNPcktleSkge1xuICAgIHN3aXRjaCAodHlwZW9mIGZ1bmNPcktleSkge1xuICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICByZXR1cm4gZnVuY09yS2V5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIHZhciBrZXlzID0gZnVuY09yS2V5LnNwbGl0KCcuJyk7XG4gICAgICAgICAgICB2YXIgYW5zID0gZGF0YTtcbiAgICAgICAgICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGkpIHtcbiAgICAgICAgICAgICAgICBhbnMgPSBkYXRhW2tleV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBhbnM7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7XG4iLCJ2YXIgVm93ID0gcmVxdWlyZSgnLi4vdm93L3ZvdycpO1xudmFyIEZhY3RvcnkgPSByZXF1aXJlKCcuLi9mYWN0b3J5L2ZhY3RvcnknKTtcbnZhciBhamF4ID0gcmVxdWlyZSgnLi4vaGVscGVycy9hamF4Jyk7XG52YXIgcGFyYW0gPSByZXF1aXJlKCcuLi9oZWxwZXJzL3BhcmFtJyk7XG52YXIgRGF0YSA9IEZhY3RvcnkuZXh0ZW5kKHtcbiAgICBhamF4OiBmdW5jdGlvbihvcHRzKXtcbiAgICAgICAgaWYgKCFvcHRzLnVybCkgdGhyb3cgbmV3IEVycm9yKCdVcmwgaXMgcmVxdWlyZWQuJyk7XG4gICAgICAgIGlmICghb3B0cy50eXBlKSB0aHJvdyBuZXcgRXJyb3IoJ1JlcXVlc3QgdHlwZSBpcyByZXF1aXJlZC4nKTtcblxuICAgICAgICBvcHRzLmNvbnRlbnRUeXBlID0gb3B0cy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgIG9wdHMuZW5jb2RlICAgICAgPSBvcHRzLmVuY29kZSB8fCBudWxsO1xuICAgICAgICBvcHRzLnBheWxvYWQgICAgID0gb3B0cy5wYXlsb2FkIHx8IG51bGw7XG4gICAgICAgIG9wdHMuaW5kZXhCeSAgICAgPSBvcHRzLmluZGV4QnkgfHwgJ2lkJztcblxuICAgICAgICByZXR1cm4gYWpheChvcHRzKVxuICAgICAgICAgICAgICAgIC50aGVuKF9wYXJzZS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgIC50aGVuKF91cGRhdGVTdG9yZS5iaW5kKHRoaXMpKTtcblxuICAgICAgICBmdW5jdGlvbiBfdXBkYXRlU3RvcmUocnNwKSB7XG4gICAgICAgICAgICBpZiAob3B0cy50eXBlLnRvVXBwZXJDYXNlKCkgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocnNwKSkge1xuICAgICAgICAgICAgICAgICAgICByc3AuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVuc2V0KGRbb3B0cy5pbmRleEJ5XSwgZCk7XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnNwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVuc2V0KHJzcFtvcHRzLmluZGV4QnldLCByc3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocnNwKSkge1xuICAgICAgICAgICAgICAgICAgICByc3AuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChkW29wdHMuaW5kZXhCeV0sIGQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJzcCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQocnNwW29wdHMuaW5kZXhCeV0sIHJzcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJzcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9wYXJzZShyc3ApIHtcbiAgICAgICAgICAgIGlmIChvcHRzLnBhcnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMucGFyc2UocnNwKTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZShyc3ApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHBhcnNlOiBmdW5jdGlvbihyc3ApIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocnNwKTtcbiAgICB9XG59KTtcblxudmFyIGRhdGFzdG9yZSA9IHt9O1xudmFyIFJlc291cmNlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5SZXNvdXJjZS5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKGRhdGFzdG9yZVtuYW1lXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc291cmNlICcgKyBuYW1lICsgJyBhbHJlYWR5IGV4aXN0LicpO1xuICAgIH1cblxuICAgIGRhdGFzdG9yZVtuYW1lXSA9IG5ldyBEYXRhKCk7XG4gICAgcmV0dXJuIGRhdGFzdG9yZVtuYW1lXTtcbn07XG5cblJlc291cmNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGRhdGFzdG9yZVtuYW1lXSA/IGRhdGFzdG9yZVtuYW1lXSA6IHRoaXMucmVnaXN0ZXIobmFtZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2U7XG4iLCJ2YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ3NlcnZpY2UnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2V4dGVuZCcpO1xuXG52YXIgU2VydmljZSA9IHt9O1xuXG5TZXJ2aWNlLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuU2VydmljZS5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMudXVpZCA9IElkR2VuZXJhdG9yKCk7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5TZXJ2aWNlLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24odGFyZ2V0LCBldmVudHMpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gZXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGFyZ2V0LmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG59O1xuXG5TZXJ2aWNlLmV4dGVuZCA9IGV4dGVuZDtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlOyIsInZhciBtaXhpbnMgPSB7fTtcbnZhciB2YXJpYWJsZXMgPSB7fTtcblxudmFyIFN0eWxpemVyID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbihzdHlsZSkge1xuICAgIHZhciByZXQgPSAnJztcblxuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIHN0eWxlKSB7XG4gICAgICAgIHJldCArPSBzZWxlY3RvciArICd7JztcbiAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBzdHlsZVtzZWxlY3Rvcl07XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgcmV0ICs9IHByb3AgKyAnOicgKyBzZXR0aW5nICsgJzsnO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IHJldC5zbGljZSgwLCByZXQubGVuZ3RoIC0gMSk7XG4gICAgICAgIHJldCArPSAnfSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5jcmVhdGVTdHlsZVRhZyA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIHRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGUgPSB0aGlzLnN0cmluZ2lmeShzdHlsZSk7XG4gICAgdGFnLmlubmVyVGV4dCA9IHN0eWxlO1xuICAgIHJldHVybiB0YWc7XG59XG5cblN0eWxpemVyLnByb3RvdHlwZS5yZWdpc3Rlck1peGlucyA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIG1peGluc1trZXldID0gZnVuYztcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5yZWdpc3RlclZhcmlhYmxlcyA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgdmFyaWFibGVzW2tleV0gPSB2YWw7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuZ2V0VmFyaWFibGUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIXZhcmlhYmxlc1trZXldKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1ZhcmlhYmxlICcgKyBrZXkgKyAnIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiB2YXJpYWJsZXNba2V5XTtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5nZXRNaXhpbnMgPSBmdW5jdGlvbihrZXksIG9wdHMpIHtcbiAgICBpZiAoIW1peGluc1trZXldKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01peGluICcgKyBrZXkgKyAnIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBtaXhpbnNba2V5XS5jYWxsKHRoaXMsIG9wdHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHlsaXplcjsiLCJ2YXIgTGlua2VkTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgdGhpcy50YWlsID0gbnVsbDtcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLmFkZFRvVGFpbCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHRpY2sgPSB7XG4gICAgICAgIGZ1bmM6IGZuLFxuICAgICAgICBuZXh0OiBudWxsXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmhlYWQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGljaztcbiAgICAgICAgdGhpcy5oZWFkLm5leHQgPSB0aGlzLnRhaWw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFpbCkge1xuICAgICAgICB0aGlzLnRhaWwubmV4dCA9IHRpY2s7XG4gICAgfVxuICAgIFxuICAgIHRoaXMudGFpbCA9IHRpY2s7XG59O1xuXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5yZW1vdmVIZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByZXZpb3VzSGVhZDtcblxuICAgIGlmICh0aGlzLmhlYWQpIHtcbiAgICAgICAgcHJldmlvdXNIZWFkID0gdGhpcy5oZWFkLmZ1bmM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhZC5uZXh0KSB7XG4gICAgICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGFpbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzSGVhZDtcbn07XG5cbnZhciBQRU5ESU5HICA9IHt9LFxuICAgIFJFU09MVkVEID0ge30sXG4gICAgUkVKRUNURUQgPSB7fTsgXG5cbnZhciBWb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdm93ID0ge307XG5cbiAgICB2YXIgc3RhdHVzICAgICAgID0gUEVORElORztcbiAgICB2YXIgcmVzb2x2ZVRpY2tzID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgcmVqZWN0VGlja3MgID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgZG9uZVRpY2ssIGV4Y2VwdGlvbiwgdmFsLCBmbjtcblxuICAgIHZvdy5yZXNvbHZlID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFJFSkVDVEVEIHx8ICFyZXNvbHZlVGlja3MuaGVhZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXR1cyA9IFJFU09MVkVEO1xuICAgICAgICAgICAgdmFsID0gcmV0O1xuXG4gICAgICAgICAgICBmbiA9IHJlc29sdmVUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFsID0gZm4uY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICAgICAgdm93LnJlamVjdChlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh2YWwgJiYgdHlwZW9mIHZhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdmFsLnRoZW4odm93LnJlc29sdmUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm93LnJlc29sdmUodmFsKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICB9O1xuXG4gICAgdm93LnJlamVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVTT0xWRUQgfHwgIXJlamVjdFRpY2tzLmhlYWQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVEb25lKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0dXMgPSBSRUpFQ1RFRDtcbiAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG5cbiAgICAgICAgICAgIGZuID0gcmVqZWN0VGlja3MucmVtb3ZlSGVhZCgpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGVycjtcbiAgICAgICAgICAgICAgICB2b3cucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3cucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG5cbiAgICB9O1xuXG5cbiAgICB2b3cucHJvbWlzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB7fVxuXG4gICAgICAgIHByb21pc2UudGhlbiA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIHJlc29sdmVUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmNhdGNoID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVqZWN0VGlja3MuYWRkVG9UYWlsKGZ1bmMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJvbWlzZS5kb25lID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgZG9uZVRpY2sgPSBmdW5jO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuXG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2b3c7XG4gICAgXG4gICAgZnVuY3Rpb24gaGFuZGxlRG9uZSgpIHtcbiAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkb25lVGljaykge1xuICAgICAgICAgICAgZG9uZVRpY2suY2FsbCh0aGlzLCB2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVRpY2tzID0gbnVsbDtcbiAgICAgICAgcmVqZWN0VGlja3MgID0gbnVsbDtcbiAgICAgICAgZG9uZVRpY2sgICAgID0gbnVsbDtcbiAgICAgICAgZXhjZXB0aW9uICAgID0gbnVsbDtcbiAgICAgICAgdmFsICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgZm4gICAgICAgICAgID0gbnVsbDtcblxuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZvdztcblxuIiwid2luZG93LlRyaW8gPSByZXF1aXJlKCd0cmlvJyk7Il19
