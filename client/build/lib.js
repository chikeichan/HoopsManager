(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{"../eventBus/eventBus":1,"../helpers/IdGenerator":3,"../helpers/defaults":5,"../helpers/extend":6}],3:[function(require,module,exports){
module.exports = function(str) {
    var count = 1;

    return function() {
        var id = str + count;
        count++;
        return id;
    }
};


},{}],4:[function(require,module,exports){
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
},{"../vow/vow":15}],5:[function(require,module,exports){
module.exports = function (obj, defaults) {
    defaults = defaults || {};
    
    for (var key in defaults) {
        if (!obj[key]) {
            obj[key] = defaults[key];
        }
    }

    return obj;
}
},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
var Factory = require('./factory/factory');
var Service = require('./service/service');
var View = require('./view/view');
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
    View: View,
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

},{"./eventBus/eventBus":1,"./factory/factory":2,"./module/module":9,"./renderer/renderer":10,"./resource/resource":11,"./service/service":12,"./stylizer/stylizer":13,"./view/view":14,"./vow/vow":15}],9:[function(require,module,exports){
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

},{"../vow/vow":15}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"../factory/factory":2,"../helpers/ajax":4,"../helpers/param":7,"../vow/vow":15}],12:[function(require,module,exports){
var IdGenerator = require('../helpers/IdGenerator')('service');
var extend = require('../helpers/extend');

var Service = {};

Service._constructor = function(opts) {
    this._initialize(opts);
};

Service._constructor.prototype._initialize = function(opts) {
    this.id = IdGenerator();

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
},{"../helpers/IdGenerator":3,"../helpers/extend":6}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
        view.host = this.createShadowRoot();
        view.host.appendChild(view.template);
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

},{"../eventBus/eventBus":1,"../helpers/IdGenerator":3,"../helpers/extend":6,"../stylizer/stylizer":13}],15:[function(require,module,exports){
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
},{"trio":8}]},{},[16])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2V2ZW50QnVzL2V2ZW50QnVzLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9mYWN0b3J5L2ZhY3RvcnkuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvYWpheC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9kZWZhdWx0cy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvaGVscGVycy9leHRlbmQuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvcGFyYW0uanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2R1bGUvbW9kdWxlLmpzIiwiLi4vVHJpbml0eUpTL3NyYy9yZW5kZXJlci9yZW5kZXJlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvcmVzb3VyY2UvcmVzb3VyY2UuanMiLCIuLi9UcmluaXR5SlMvc3JjL3NlcnZpY2Uvc2VydmljZS5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvdm93L3Zvdy5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgRXZlbnRCdXMgPSBmdW5jdGlvbigpIHtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGlkID0gaWQ7XG4gICAgdmFyIGV2ZW50cyA9IHt9O1xuICAgIHJldHVybiAoZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgICB2YXIgZXZ0ID0ge31cbiAgICAgICAgZXZ0LnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgICAgICBjb250ZXh0Ll9zdWJzY3JpYmUoZXZlbnQsIGZ1bmMsIGlkLCBldmVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBldnQucHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3B1Ymxpc2goZXZlbnQsIGN0eCwgYXJncywgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3Vuc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZXZ0LnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuX3Vuc3Vic2NyaWJlQWxsKGV2ZW50LCBpZCwgZXZlbnRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXZ0O1xuICAgIH0pKHRoaXMpO1xufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIGlmICghZXZlbnRzW2V2ZW50XSkge1xuICAgICAgICBldmVudHNbZXZlbnRdID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFldmVudHNbZXZlbnRdW2lkXSkge1xuICAgICAgICBldmVudHNbZXZlbnRdW2lkXSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIGV2ZW50c1tldmVudF1baWRdLnB1c2goZnVuYyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3B1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzLCBldmVudHMpIHtcbiAgICBjdHggPSBjdHggfHwgbnVsbDtcbiAgICBhcmdzID0gYXJncyB8fCBudWxsO1xuXG4gICAgdmFyIGV2ZW50QnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChldmVudEJ1Y2tldCkge1xuICAgICAgICBmb3IgKHZhciBidWNrZXQgaW4gZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgICAgIHZhciBjYlF1ZXVlID0gZXZlbnRCdWNrZXRbYnVja2V0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNiUXVldWUpKSB7XG4gICAgICAgICAgICAgICAgY2JRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGJ1Y2tldCkge1xuICAgICAgICB2YXIgcXVldWUgPSBidWNrZXRbaWRdO1xuXG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZm4sIGkpIHtcbiAgICAgICAgICAgIGlmKGZuID09PSBmdW5jKSB7XG4gICAgICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IFxuXG4gICAgZm9yICh2YXIgZXZ0IGluIGV2ZW50cykge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5zdWJzcmliZU9uZShldmVudCkge1xuICAgICAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgICAgICBpZiAoYnVja2V0ICYmIGJ1Y2tldFtpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBidWNrZXRbaWRdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1cztcbiIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgSWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0lkR2VuZXJhdG9yJykoJ2ZhY3RvcnknKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2V4dGVuZCcpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi4vaGVscGVycy9kZWZhdWx0cycpO1xuXG52YXIgRmFjdG9yeSA9IHt9O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciBhdHRyaWJ1dGVzID0ge307XG5cbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMucmVzb3VyY2VzID0ge307XG4gICAgdGhpcy5ldmVudEJ1cyA9IG9wdHMuZXZlbnRCdXMgfHwgbmV3IEV2ZW50QnVzKCk7XG4gICAgdGhpcy5ldmVudEJ1cyA9IHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgICAgIHRoaXMuX3NldChrZXksIHZhbCwgYXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgdGhpcy51bnNldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB0aGlzLl91bnNldChrZXksIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF0dHJpYnV0ZXMpKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChkZWZhdWx0cyhvcHRzLCB0aGlzLmRlZmF1bHRzKSk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplJywgdGhpcywgb3B0cyk7XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3NldCA9IGZ1bmN0aW9uKGtleSwgdmFsLCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldChrLCBrZXlba10sIGF0dHJpYnV0ZXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHZhbDtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICByZXRba2V5XSA9IHZhbDtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2UnLCB0aGlzLCByZXQpO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZTonICsga2V5LCB0aGlzLCB2YWwpO1xuICAgIH1cbn07XG5cbkZhY3RvcnkuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5fZ2V0ID0gZnVuY3Rpb24oa2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBhdHRyaWJ1dGVzW2tleV07XG4gICAgfSAgZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxufTtcblxuRmFjdG9yeS5fY29uc3RydWN0b3IucHJvdG90eXBlLl91bnNldCA9IGZ1bmN0aW9uKGtleSwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHJldFtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICBkZWxldGUgYXR0cmlidXRlc1trZXldO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2RlbGV0ZScsIHRoaXMsIHJldCk7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnZGVsZXRlOicgKyBrZXksIHRoaXMsIHJldFtrZXldKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgdGhpcy5fdW5zZXQoaywgYXR0cmlidXRlcyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GYWN0b3J5Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uKHJlc291cmNlLCBpZCkge1xuICAgIHRoaXMucmVzb3VyY2VzW3Jlc291cmNlXSA9IHJlc291cmNlO1xuXG4gICAgcmVzb3VyY2UuZXZlbnRCdXMuc3Vic2NyaWJlKCdjaGFuZ2U6JyArIGlkLCBmdW5jdGlvbihjdHgsIGF0dHJzKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cnMpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGssIGF0dHJzW2tdKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXNvdXJjZS5ldmVudEJ1cy5zdWJzY3JpYmUoJ2RlbGV0ZTonICsgaWQsIGZ1bmN0aW9uKGN0eCwgYXR0cnMpIHtcbiAgICAgICAgdGhpcy51bnNldCgpO1xuICAgIH0uYmluZCh0aGlzKSlcbn07XG5cbkZhY3RvcnkuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY3Rvcnk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBjb3VudCA9IDE7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IHN0ciArIGNvdW50O1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxufTtcblxuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgdm93ID0gVm93KCk7XG5cbiAgICBpZiAob3B0cy5lbmNvZGUpIHtcbiAgICAgICAgb3B0cy51cmwgKz0gZW5jb2RlVVJJKG9wdHMuZW5jb2RlKG9wdHMucGF5bG9hZCkpO1xuICAgIH1cblxuICAgIHhoci5vcGVuKG9wdHMudHlwZS50b1VwcGVyQ2FzZSgpLCBvcHRzLnVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIG9wdHMuY29udGVudFR5cGUpO1xuXG4gICAgZm9yICh2YXIgaGVhZGVyIGluIG9wdHMuaGVhZGVycykge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIG9wdHMuaGVhZGVyc1toZWFkZXJdKTtcbiAgICB9XG5cbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAgICAgdm93LnJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2b3cucmVqZWN0KHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5jb2RlKSB7XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkob3B0cy5wYXlsb2FkKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZvdy5wcm9taXNlO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmosIGRlZmF1bHRzKSB7XG4gICAgZGVmYXVsdHMgPSBkZWZhdWx0cyB8fCB7fTtcbiAgICBcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgaWYgKCFvYmpba2V5XSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBkZWZhdWx0c1trZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBlbmNvZGVkU3RyaW5nID0gJyc7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgaWYgKGVuY29kZWRTdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGVuY29kZWRTdHJpbmcgKz0gJyYnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5jb2RlZFN0cmluZyArPSBlbmNvZGVVUkkocHJvcCArICc9JyArIG9iamVjdFtwcm9wXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZWRTdHJpbmc7XG59IiwidmFyIEZhY3RvcnkgPSByZXF1aXJlKCcuL2ZhY3RvcnkvZmFjdG9yeScpO1xudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuL3NlcnZpY2Uvc2VydmljZScpO1xudmFyIFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcvdmlldycpO1xudmFyIFN0eWxpemVyID0gcmVxdWlyZSgnLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4vbW9kdWxlL21vZHVsZScpO1xudmFyIFJlc291cmNlID0gcmVxdWlyZSgnLi9yZXNvdXJjZS9yZXNvdXJjZScpO1xudmFyIFJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJlci9yZW5kZXJlcicpO1xudmFyIFZvdyA9IHJlcXVpcmUoJy4vdm93L3ZvdycpO1xuXG52YXIgZ0V2ZW50QnVzID0gbmV3IEV2ZW50QnVzKCk7O1xuXG52YXIgVHJpbyA9IHtcbiAgICBGYWN0b3J5OiBGYWN0b3J5LFxuICAgIFNlcnZpY2U6IFNlcnZpY2UsXG4gICAgVmlldzogVmlldyxcbiAgICBWb3c6IFZvdyxcbiAgICBTdHlsaXplcjogbmV3IFN0eWxpemVyKCksXG4gICAgUmVuZGVyZXI6IG5ldyBSZW5kZXJlcigpLFxuICAgIE1vZHVsZTogbmV3IE1vZHVsZSgpLFxuICAgIFJlc291cmNlOiBuZXcgUmVzb3VyY2UoKVxufVxuXG5UcmlvLnJlZ2lzdGVyR2xvYmFsRXZlbnRCdXMgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiBnRXZlbnRCdXMucmVnaXN0ZXIoaWQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmlvO1xuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcbnZhciBtb2R1bGVTdG9yZSA9IHt9O1xuXG52YXIgTW9kdWxlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5Nb2R1bGUucHJvdG90eXBlLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBuYW1lIGlzIG5vdCBhIHN0cmluZy4nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2R1bGUgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIG1vZHVsZVN0b3JlW2tleV0gPSBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgIGRvbmUoZnVuYygpKTtcbiAgICB9O1xufTtcblxuTW9kdWxlLnByb3RvdHlwZS5pbXBvcnQgPSBmdW5jdGlvbihtb2R1bGVzKSB7XG4gICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgdmFyIGNvdW50ICA9IE9iamVjdC5rZXlzKG1vZHVsZXMpO1xuICAgIHZhciB2b3cgPSBWb3coKTtcbiAgICB2YXIgcmV0ID0ge307XG4gICAgdmFyIHVybDtcblxuICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuXG4gICAgdm93LnByb21pc2UuYW5kID0ge307XG4gICAgdm93LnByb21pc2UuYW5kLmV4cG9ydCA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgICAgICBtb2R1bGVTdG9yZVtrZXldID0gZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICAgICAgdm93LnByb21pc2VcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlU3RvcmVba2V5XSA9IGZ1bmMuYmluZCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJldCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgIC5kb25lKGRvbmUpO1xuICAgICAgICB9O1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHZvdy5wcm9taXNlLmFuZC5pbXBvcnQgPSBmdW5jdGlvbihtb2R1bGVzKSB7XG4gICAgICAgIHJldHVybiB2b3cucHJvbWlzZS50aGVuKHRoaXMuaW1wb3J0LmJpbmQodGhpcywgbW9kdWxlcykpO1xuICAgIH0uYmluZCh0aGlzKVxuXG4gICAgcmV0dXJuIHZvdy5wcm9taXNlO1xuXG4gICAgZnVuY3Rpb24gX2ltcG9ydChrZXkpIHtcbiAgICAgICAgdmFyIHVybCA9IG1vZHVsZXNba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIG5hbWUgaXMgbm90IGEgc3RyaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB1cmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VSTCBpcyBub3QgYSBzdHJpbmcuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbW9kdWxlID0gbW9kdWxlU3RvcmVba2V5XTtcbiAgICAgICAgXG4gICAgICAgIGlmICghbW9kdWxlKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgICAgICAgICAgIHNjcmlwdC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICAgICAgICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgICAgICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVyID0gVm93KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTG9hZGluZyAnICsga2V5ICsgJy4uLicpO1xuXG4gICAgICAgICAgICAgICAgZGVmZXIucHJvbWlzZS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0W2tleV0gPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICBsb2FkZWQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm93LnJlc29sdmUocmV0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9pbXBvcnQoY291bnQucG9wKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBzY3JpcHQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlU3RvcmVba2V5XShkZWZlci5yZXNvbHZlKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzLCBrZXkpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2b3cucmVzb2x2ZShtb2R1bGUoKSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTtcbiIsInZhciBSZW5kZXJlciA9IGZ1bmN0aW9uKCl7XG5cbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVGVtcGxhdGUoKTtcbn07XG5cbnZhciBfY3VycmVudFN0YXRlID0gW107XG52YXIgX3F1ZXVlID0gW107XG52YXIgX2NvbmRpdGlvbmFsID0gdW5kZWZpbmVkO1xudmFyIF9zdGF0ZTtcbnZhciBfbG9vcDtcbnZhciBfc3RhcnQ7XG52YXIgVGVtcGxhdGUgPSBmdW5jdGlvbigpe307XG5cbi8qKlxuICogQ3JlYXRlIERPTSBub2RlXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHRhZ05hbWUgRWxlbWVudCBuYW1lXG4gKiBAcmV0dXJuIHtpbnN0YW5jZX0gICAgICAgdGhpc1xuICovXG5UZW1wbGF0ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24odGFnTmFtZSl7XG4gICAgdGFnTmFtZSA9IHBhcnNlVGFnKHRhZ05hbWUpO1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWVbMF0pO1xuICAgICAgICBpZiAodGFnTmFtZVsxXSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSB0YWdOYW1lWzJdO1xuICAgICAgICB9IGVsc2UgaWYgKHRhZ05hbWVbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSB0YWdOYW1lWzJdO1xuICAgICAgICB9XG4gICAgICAgIF9jdXJyZW50U3RhdGUucHVzaChlbCk7XG4gICAgfS5iaW5kKHRoaXMpXG4gICAgX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnb3BlbicsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVGVtcGxhdGUucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZWwgPSBncmFiTGFzdC5jYWxsKHRoaXMpO1xuICAgICAgICBjbGFzc05hbWUgPSBldmFsdWF0ZShkLCBjbGFzc05hbWUpO1xuICAgICAgICB2YXIgc2VwYXJhdG9yID0gZWwuY2xhc3NOYW1lLmxlbmd0aCA+IDAgPyAnICcgOiAnJztcbiAgICAgICAgaWYgKCFoYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgKz0gc2VwYXJhdG9yICsgY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2FkZENsYXNzJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5UZW1wbGF0ZS5wcm90b3R5cGUudGV4dCA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBlbCA9IGdyYWJMYXN0LmNhbGwodGhpcyk7XG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVGVtcGxhdGUucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZWwgPSBncmFiTGFzdC5jYWxsKHRoaXMpO1xuICAgICAgICBjbGFzc05hbWUgPSBldmFsdWF0ZShkLCBjbGFzc05hbWUpO1xuICAgICAgICBpZiAoaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKTtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlZywnICcpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3JlbW92ZUNsYXNzJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5UZW1wbGF0ZS5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZWwgPSBfY3VycmVudFN0YXRlLnBvcCgpO1xuICAgICAgICBpZiAoX2N1cnJlbnRTdGF0ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNGcmFnbWVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZ3JhYkxhc3QuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG4gICAgX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRlbXBsYXRlLnByb3RvdHlwZS5pZiA9IGZ1bmN0aW9uKGZ1bmNPcktleSkge1xuICAgIHZhciBmbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgX3N0YXRlID0gJ2NvbmRpdGlvbmFsJztcbiAgICAgICAgZnVuY09yS2V5ID0gZXZhbHVhdGUoZCwgZnVuY09yS2V5KTtcbiAgICAgICAgX2NvbmRpdGlvbmFsID0gISFmdW5jT3JLZXk7XG4gICAgfS5iaW5kKHRoaXMpXG4gICAgX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnaWYnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVGVtcGxhdGUucHJvdG90eXBlLmVsc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkKSB7XG4gICAgICAgIF9jb25kaXRpb25hbCA9ICFfY29uZGl0aW9uYWw7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIF9xdWV1ZS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2Vsc2UnLFxuICAgICAgICBmbjogZm5cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVGVtcGxhdGUucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbihmdW5jT3JLZXkpIHtcbiAgICB2YXIgZm4gPSBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIGZ1bmNPcktleSA9IGV2YWx1YXRlKGQsIGZ1bmNPcktleSk7XG4gICAgICAgIF9sb29wICA9IGZ1bmNPcktleTtcbiAgICAgICAgX3N0YXRlID0gJ2xvb3AnO1xuICAgICAgICBfc3RhcnQgPSBpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICBfcXVldWUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdlYWNoJyxcbiAgICAgICAgZm46IGZuXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblRlbXBsYXRlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZuID0gZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICBfY29uZGl0aW9uYWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIF9zdGF0ZSAgICAgICA9IHVuZGVmaW5lZDtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgX3F1ZXVlLnB1c2goe1xuICAgICAgICB0eXBlOiAnZG9uZScsXG4gICAgICAgIGZuOiBmblxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5UZW1wbGF0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMucHJldmlvdXNGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICBfcXVldWUuZm9yRWFjaChmdW5jdGlvbihxLCBpKSB7XG4gICAgICAgIHN3aXRjaCAoX3N0YXRlKSB7XG4gICAgICAgICAgICBjYXNlICdjb25kaXRpb25hbCc6XG4gICAgICAgICAgICAgICAgaWYgKF9jb25kaXRpb25hbCB8fCBxLnR5cGUgPT09ICdlbHNlJyB8fCBxLnR5cGUgPT09ICdkb25lJykge1xuICAgICAgICAgICAgICAgICAgICBxLmZuKGRhdGEsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xvb3AnOlxuICAgICAgICAgICAgICAgIGlmIChxLnR5cGUgPT09ICdkb25lJykge1xuICAgICAgICAgICAgICAgICAgICBfbG9vcC5mb3JFYWNoKGZ1bmN0aW9uKGwsIGopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHN0YXJ0ID0gX3N0YXJ0ICsgMTsgc3RhcnQgPCBpOyBzdGFydCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvb3BGbiA9IF9xdWV1ZVtzdGFydF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcEZuLmZuKGwsIGopO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgICAgICBxLmZuKGRhdGEsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcS5mbihkYXRhLCBpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4gdGhpcy5wcmV2aW91c0ZyYWdtZW50O1xufTtcblxuZnVuY3Rpb24gZ3JhYkxhc3QoKSB7XG4gICAgcmV0dXJuIF9jdXJyZW50U3RhdGVbX2N1cnJlbnRTdGF0ZS5sZW5ndGggLSAxXTtcbn07XG5cbmZ1bmN0aW9uIGhhc0NsYXNzKGVsLCBjbGFzc05hbWUpIHtcbiAgcmV0dXJuICEhZWwuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKSk7XG59O1xuXG5mdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICB0YWcgPSB0YWcucmVwbGFjZSgvWy4jXS8sIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICcsJyArIGQgKyAnLCd9KVxuICAgICAgICAgICAgIC5zcGxpdCgnLCcpO1xuICAgIHJldHVybiB0YWc7XG59O1xuXG5mdW5jdGlvbiBldmFsdWF0ZShkYXRhLCBmdW5jT3JLZXkpIHtcbiAgICBzd2l0Y2ggKHR5cGVvZiBmdW5jT3JLZXkpIHtcbiAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmNPcktleS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICB2YXIga2V5cyA9IGZ1bmNPcktleS5zcGxpdCgnLicpO1xuICAgICAgICAgICAgdmFyIGFucyA9IGRhdGE7XG4gICAgICAgICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpKSB7XG4gICAgICAgICAgICAgICAgYW5zID0gZGF0YVtrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xuIiwidmFyIFZvdyA9IHJlcXVpcmUoJy4uL3Zvdy92b3cnKTtcbnZhciBGYWN0b3J5ID0gcmVxdWlyZSgnLi4vZmFjdG9yeS9mYWN0b3J5Jyk7XG52YXIgYWpheCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvYWpheCcpO1xudmFyIHBhcmFtID0gcmVxdWlyZSgnLi4vaGVscGVycy9wYXJhbScpO1xudmFyIG1ldGhvZHMgPSBbJ3JlYWQnLCAnY3JlYXRlJywgJ3VwZGF0ZScsICdkZWxldGUnXTtcbnZhciBEYXRhID0gRmFjdG9yeS5leHRlbmQoe1xuICAgIGFqYXg6IGZ1bmN0aW9uKG9wdHMpe1xuICAgICAgICBpZiAoIW9wdHMudXJsKSB0aHJvdyBuZXcgRXJyb3IoJ1VybCBpcyByZXF1aXJlZC4nKTtcbiAgICAgICAgaWYgKCFvcHRzLnR5cGUpIHRocm93IG5ldyBFcnJvcignUmVxdWVzdCB0eXBlIGlzIHJlcXVpcmVkLicpO1xuXG4gICAgICAgIG9wdHMuY29udGVudFR5cGUgPSBvcHRzLmNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgb3B0cy5lbmNvZGUgICAgICA9IG9wdHMuZW5jb2RlIHx8IG51bGw7XG4gICAgICAgIG9wdHMucGF5bG9hZCAgICAgPSBvcHRzLnBheWxvYWQgfHwgbnVsbDtcbiAgICAgICAgb3B0cy5pbmRleEJ5ICAgICA9IG9wdHMuaW5kZXhCeSB8fCAnaWQnO1xuXG4gICAgICAgIHJldHVybiBhamF4KG9wdHMpXG4gICAgICAgICAgICAgICAgLnRoZW4oX3BhcnNlLmJpbmQodGhpcykpXG4gICAgICAgICAgICAgICAgLnRoZW4oX3VwZGF0ZVN0b3JlLmJpbmQodGhpcykpO1xuXG4gICAgICAgIGZ1bmN0aW9uIF91cGRhdGVTdG9yZShyc3ApIHtcbiAgICAgICAgICAgIGlmIChvcHRzLnR5cGUudG9VcHBlckNhc2UoKSA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyc3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIHJzcC5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW5zZXQoZFtvcHRzLmluZGV4QnldLCBkKTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByc3AgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudW5zZXQocnNwW29wdHMuaW5kZXhCeV0sIHJzcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyc3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIHJzcC5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KGRbb3B0cy5pbmRleEJ5XSwgZCk7XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnNwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChyc3Bbb3B0cy5pbmRleEJ5XSwgcnNwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnNwO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlKHJzcCkge1xuICAgICAgICAgICAgaWYgKG9wdHMucGFyc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5wYXJzZShyc3ApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlKHJzcCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHJzcCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShyc3ApO1xuICAgIH1cbn0pO1xuXG52YXIgZGF0YXN0b3JlID0ge307XG52YXIgUmVzb3VyY2UgPSBmdW5jdGlvbigpIHtcbn07XG5cblJlc291cmNlLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAoZGF0YXN0b3JlW25hbWVdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVzb3VyY2UgJyArIG5hbWUgKyAnIGFscmVhZHkgZXhpc3QuJyk7XG4gICAgfVxuXG4gICAgZGF0YXN0b3JlW25hbWVdID0gbmV3IERhdGEoKTtcbiAgICByZXR1cm4gZGF0YXN0b3JlW25hbWVdO1xufTtcblxuUmVzb3VyY2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gZGF0YXN0b3JlW25hbWVdID8gZGF0YXN0b3JlW25hbWVdIDogdGhpcy5yZWdpc3RlcihuYW1lKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXNvdXJjZTtcbiIsInZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnc2VydmljZScpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG5cbnZhciBTZXJ2aWNlID0ge307XG5cblNlcnZpY2UuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5TZXJ2aWNlLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5pZCA9IElkR2VuZXJhdG9yKCk7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5TZXJ2aWNlLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24odGFyZ2V0LCBldmVudHMpIHtcbiAgICBmb3IgKHZhciBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gZXZlbnRzW2V2dF07XG4gICAgICAgIHZhciBmbiA9IHRoaXNbaGFuZGxlcl0gPSB0aGlzW2hhbmRsZXJdLmJpbmQodGhpcylcbiAgICAgICAgdGFyZ2V0LmV2ZW50QnVzLnN1YnNjcmliZShldnQsIGZuKTtcbiAgICB9XG59O1xuXG5TZXJ2aWNlLmV4dGVuZCA9IGV4dGVuZDtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlOyIsInZhciBtaXhpbnMgPSB7fTtcbnZhciB2YXJpYWJsZXMgPSB7fTtcblxudmFyIFN0eWxpemVyID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbihzdHlsZSkge1xuICAgIHZhciByZXQgPSAnJztcblxuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIHN0eWxlKSB7XG4gICAgICAgIHJldCArPSBzZWxlY3RvciArICd7JztcbiAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBzdHlsZVtzZWxlY3Rvcl07XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgcmV0ICs9IHByb3AgKyAnOicgKyBzZXR0aW5nICsgJzsnO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IHJldC5zbGljZSgwLCByZXQubGVuZ3RoIC0gMSk7XG4gICAgICAgIHJldCArPSAnfSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5yZWdpc3Rlck1peGlucyA9IGZ1bmN0aW9uKGtleSwgZnVuYykge1xuICAgIG1peGluc1trZXldID0gZnVuYztcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5yZWdpc3RlclZhcmlhYmxlcyA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgdmFyaWFibGVzW2tleV0gPSB2YWw7XG59O1xuXG5TdHlsaXplci5wcm90b3R5cGUuZ2V0VmFyaWFibGUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIXZhcmlhYmxlc1trZXldKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1ZhcmlhYmxlICcgKyBrZXkgKyAnIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiB2YXJpYWJsZXNba2V5XTtcbn07XG5cblN0eWxpemVyLnByb3RvdHlwZS5nZXRNaXhpbnMgPSBmdW5jdGlvbihrZXksIG9wdHMpIHtcbiAgICBpZiAoIW1peGluc1trZXldKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01peGluICcgKyBrZXkgKyAnIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBtaXhpbnNba2V5XS5jYWxsKHRoaXMsIG9wdHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHlsaXplcjsiLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cy9ldmVudEJ1cycpO1xudmFyIFN0eWxpemVyID0gcmVxdWlyZSgnLi4vc3R5bGl6ZXIvc3R5bGl6ZXInKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgndmlldycpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvZXh0ZW5kJyk7XG5cbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZSB8fCB7fTtcbiAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlIHx8IHt9O1xuICAgIHZhciBzdHlsZVRhZywgaW5saW5lU3R5bGU7XG5cbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG5cbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gdGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLmlkKTtcblxuXG4gICAgaWYgKHRoaXMuaXNXZWJDb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5zdHlsZSA9IFN0eWxpemVyLnByb3RvdHlwZS5zdHJpbmdpZnkoc3R5bGUpO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJUZXh0ID0gdGhpcy5zdHlsZTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZS5hcHBlbmRDaGlsZChzdHlsZVRhZylcbiAgICAgICAgdGhpcy5jcmVhdGVDb21wb25lbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmxpbmVTdHlsZSA9IHRoaXMuc3R5bGVbJzpob3N0J10gfHwge307XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLnJlbmRlclRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50KCk7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gaW5saW5lU3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuc3R5bGVbYXR0cl0gPSBpbmxpbmVTdHlsZVthdHRyXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5pbml0aWFsaXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgdmFyIGVsO1xuXG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlLCBlbCk7XG5cbiAgICByZXR1cm4gZWw7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50cyh0ZW1wbGF0ZSwgYmFzZSkge1xuICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChpc1ZhbGlkVGFnKHRhZykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBjcmVhdGVPbmVFbGVtZW50LmNhbGwodGhpcywgdGFnKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNXZWJDb21wb25lbnQgJiYgdGhpcy5zdHlsZVt0YWddKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZElubGluZVN0eWxlKGVsLCB0aGlzLnN0eWxlW3RhZ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlW3RhZ10sIGVsKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnID09PSAncmVmJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmSW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YWcgPT09ICd0ZXh0Q29udGVudCcpIHtcbiAgICAgICAgICAgICAgICBiYXNlLnRleHRDb250ZW50ID0gdGVtcGxhdGVbdGFnXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRzLmNhbGwodGhpcywgYmFzZSwgdGFnLCB0ZW1wbGF0ZVt0YWddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZU9uZUVsZW1lbnQodGFnKSB7XG4gICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZVRhZyh0YWcpO1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHBhcnNlZFswXTtcblxuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuXG4gICAgICAgIGlmIChwYXJzZWRbMV0gPT09ICcuJykge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gcGFyc2VkWzJdO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnNlZFsxXSA9PT0gJyMnKSB7XG4gICAgICAgICAgICBlbC5pZCA9IHBhcnNlZFsyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRJbmxpbmVTdHlsZShlbCwgc3R5bGUpIHtcbiAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBzdHlsZSkge1xuICAgICAgICAgICAgZWwuc3R5bGVbYXR0cl0gPSBzdHlsZVthdHRyXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZEV2ZW50cyhlbCwgb3JpZ2luRXZ0LCBuZXdFdnQpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihvcmlnaW5FdnQsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaChuZXdFdnQsIHRoaXMsIGUpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVGFnKHRhZykge1xuICAgICAgICB0YWcgPSB0YWcucmVwbGFjZSgvWy4jXS8sIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICcsJyArIGQgKyAnLCd9KVxuICAgICAgICAgICAgICAgICAuc3BsaXQoJywnKTtcbiAgICAgICAgcmV0dXJuIHRhZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1ZhbGlkVGFnKHRhZykge1xuICAgICAgICB0YWcgPSB0YWcucmVwbGFjZSgvWy4jXS8sIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICcsJyArIGQgKyAnLCd9KVxuICAgICAgICAgICAgICAgICAuc3BsaXQoJywnKTtcbiAgICAgICAgcmV0dXJuICh0YWdbMV0gPT09ICcjJyB8fCB0YWdbMV0gPT09ICcuJykgJiYgdGFnLmxlbmd0aCA9PT0gMztcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBSb290LCByb290O1xuICAgIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBcblxuICAgIHRyeSB7XG4gICAgICAgIFJvb3QgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQodGhpcy50YWdOYW1lLCB7XG4gICAgICAgICAgICBwcm90b3R5cGU6IHByb3RvXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVsID0gbmV3IFJvb3QoKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy50YWdOYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsID0gbmV3IFJvb3QoKVxuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy50ZW1wbGF0ZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5jcmVhdGVDb21wb25lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmlldyA9IHRoaXM7XG4gICAgdmFyIFJvb3QsIHJvb3Q7XG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIFxuICAgIHByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2aWV3Lmhvc3QgPSB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcbiAgICAgICAgdmlldy5ob3N0LmFwcGVuZENoaWxkKHZpZXcudGVtcGxhdGUpO1xuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICAgICAgcHJvdG90eXBlOiBwcm90b1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lbCA9IG5ldyBSb290KClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG4gICAgfVxuXG5cbiAgICByZXR1cm4gdGhpcztcblxuICAgIGZ1bmN0aW9uIGlzUmVnaXN0ZWQgKG5hbWUpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpLmNvbnN0cnVjdG9yICE9PSBIVE1MRWxlbWVudDtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKCF0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgZWwuY2xhc3NOYW1lICs9IFwiIFwiICsgY2xhc3NOYW1lO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAodGhpcy5oYXNDbGFzcyhlbCxjbGFzc05hbWUpKSB7XG4gICAgICAgIHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK2NsYXNzTmFtZSsnKFxcXFxzfCQpJyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlZywnICcpO1xuICAgIH1cbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgcmV0dXJuICEhZWwuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKSk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWwucmVtb3ZlKCk7XG4gICAgdGhpcy5lbCA9IG51bGw7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuICAgIHRoaXMuZXZlbnRCdXMudW5zdWJzY3JpYmVBbGwoKTtcbn07XG5cblZpZXcuZXh0ZW5kID0gZXh0ZW5kO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7XG4iLCJ2YXIgTGlua2VkTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgdGhpcy50YWlsID0gbnVsbDtcbn07XG5cbkxpbmtlZExpc3QucHJvdG90eXBlLmFkZFRvVGFpbCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHRpY2sgPSB7XG4gICAgICAgIGZ1bmM6IGZuLFxuICAgICAgICBuZXh0OiBudWxsXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmhlYWQpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gdGljaztcbiAgICAgICAgdGhpcy5oZWFkLm5leHQgPSB0aGlzLnRhaWw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFpbCkge1xuICAgICAgICB0aGlzLnRhaWwubmV4dCA9IHRpY2s7XG4gICAgfVxuICAgIFxuICAgIHRoaXMudGFpbCA9IHRpY2s7XG59O1xuXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5yZW1vdmVIZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByZXZpb3VzSGVhZDtcblxuICAgIGlmICh0aGlzLmhlYWQpIHtcbiAgICAgICAgcHJldmlvdXNIZWFkID0gdGhpcy5oZWFkLmZ1bmM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhZC5uZXh0KSB7XG4gICAgICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGFpbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaGVhZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzSGVhZDtcbn07XG5cbnZhciBQRU5ESU5HICA9IHt9LFxuICAgIFJFU09MVkVEID0ge30sXG4gICAgUkVKRUNURUQgPSB7fTsgXG5cbnZhciBWb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdm93ID0ge307XG5cbiAgICB2YXIgc3RhdHVzICAgICAgID0gUEVORElORztcbiAgICB2YXIgcmVzb2x2ZVRpY2tzID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgcmVqZWN0VGlja3MgID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICB2YXIgZG9uZVRpY2ssIGV4Y2VwdGlvbiwgdmFsLCBmbjtcblxuICAgIHZvdy5yZXNvbHZlID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFJFSkVDVEVEIHx8ICFyZXNvbHZlVGlja3MuaGVhZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZURvbmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXR1cyA9IFJFU09MVkVEO1xuICAgICAgICAgICAgdmFsID0gcmV0O1xuXG4gICAgICAgICAgICBmbiA9IHJlc29sdmVUaWNrcy5yZW1vdmVIZWFkKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFsID0gZm4uY2FsbCh0aGlzLCByZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IFJFSkVDVEVEO1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICAgICAgdm93LnJlamVjdChlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh2YWwgJiYgdHlwZW9mIHZhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdmFsLnRoZW4odm93LnJlc29sdmUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm93LnJlc29sdmUodmFsKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICB9O1xuXG4gICAgdm93LnJlamVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUkVTT0xWRUQgfHwgIXJlamVjdFRpY2tzLmhlYWQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVEb25lKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0dXMgPSBSRUpFQ1RFRDtcbiAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG5cbiAgICAgICAgICAgIGZuID0gcmVqZWN0VGlja3MucmVtb3ZlSGVhZCgpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGVycjtcbiAgICAgICAgICAgICAgICB2b3cucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3cucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG5cbiAgICB9O1xuXG5cbiAgICB2b3cucHJvbWlzZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB7fVxuXG4gICAgICAgIHByb21pc2UudGhlbiA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICAgIHJlc29sdmVUaWNrcy5hZGRUb1RhaWwoZnVuYyk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcm9taXNlLmNhdGNoID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgcmVqZWN0VGlja3MuYWRkVG9UYWlsKGZ1bmMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJvbWlzZS5kb25lID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgICAgZG9uZVRpY2sgPSBmdW5jO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuXG4gICAgfSkoKTtcblxuICAgIHJldHVybiB2b3c7XG4gICAgXG4gICAgZnVuY3Rpb24gaGFuZGxlRG9uZSgpIHtcbiAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkb25lVGljaykge1xuICAgICAgICAgICAgZG9uZVRpY2suY2FsbCh0aGlzLCB2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVRpY2tzID0gbnVsbDtcbiAgICAgICAgcmVqZWN0VGlja3MgID0gbnVsbDtcbiAgICAgICAgZG9uZVRpY2sgICAgID0gbnVsbDtcbiAgICAgICAgZXhjZXB0aW9uICAgID0gbnVsbDtcbiAgICAgICAgdmFsICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgZm4gICAgICAgICAgID0gbnVsbDtcblxuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZvdztcblxuIiwid2luZG93LlRyaW8gPSByZXF1aXJlKCd0cmlvJyk7Il19
