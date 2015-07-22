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

var Trio = {
    Model: Model,
    Controller: Controller,
    View: View,
    Stylizer: Stylizer
}

for (var key in Trio) {
    Trio[key].extend = extend;
}

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
},{"./controller/controller":1,"./model/model":5,"./stylizer/stylizer":6,"./view/view":7}],5:[function(require,module,exports){
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
var Trio = require('trio');

Trio.Stylizer.registerVariables('buttonBgColor', '0, 156, 180');
Trio.Stylizer.registerMixins('button', function(opts) {
    return {
        height: '12px',
        width: opts.width || '60px',
        padding: '8px 4px',
        margin: '0 4px',
        'font-family': 'Arial',
        'font-size': '12px',
        'background-color': 'rgba(' + Trio.Stylizer.getVariable('buttonBgColor') + ', 0.7)',
        'text-align': 'center',
        'border-radius': '2px',
        color: 'white',
        cursor: 'pointer'
    }
});

var Player = require('./models/player/basePlayer');

var HeaderView = require('./views/header');
var HeaderController = require('./controllers/header');


var header = new HeaderController({
    view: new HeaderView({})
});
},{"./controllers/header":9,"./models/player/basePlayer":10,"./views/header":11,"trio":4}],9:[function(require,module,exports){
var Trio = require('trio');

var HeaderCtrl = Trio.Controller.extend({
    initialize: function() {
        this.view.render();
        this.view.appendComponentTo(document.body);
    }
});

module.exports = HeaderCtrl;
},{"trio":4}],10:[function(require,module,exports){
var Trio   = require('trio');
var Player = Trio.Model.extend({});

module.exports = Player;

},{"trio":4}],11:[function(require,module,exports){
var Trio = require('trio');
var HeaderStyle = require('./style/HeaderStyle');

var HeaderView = Trio.View.extend({
    tagName: 'hoops-header',

    buttonOptions: ['calendar', 'news', 'roster', 'finance'],

    style: HeaderStyle,

    template: {
        'div.info' : {},
        'div.action-buttons': {
            ref: 'buttonsContainer',
            'div.button': {
                ref: 'buttonTmpl'
            }
        },
        'div.preferences': {}
    },

    render: function() {
        this.renderButtons();
    },

    renderButtons: function() {
        this.refIndex.buttonsContainer.innerHTML = '';

        this.buttonOptions.forEach( function(btn) {
            var button = this.refIndex.buttonTmpl.cloneNode(true);
            this.addClass(button, btn);
            button.textContent = btn;
            this.refIndex.buttonsContainer.appendChild(button);
        }.bind(this));
    }
});

module.exports = HeaderView;

},{"./style/HeaderStyle":12,"trio":4}],12:[function(require,module,exports){
var Trio = require('trio');
var ButtonStyle = Trio.Stylizer.Mixins('button', {width: '100%'});

module.exports = {
    ':host': {
        width: '100%',
        height: '50px',
        'background-color': '#333333',
        margin: '0',
        display: 'flex',
        'flex-flow': 'row nowrap',
        'align-items': 'center'
    },

    'div.info': {
        height: '36px',
        width: '36px',
        margin: '4px',
        background: 'url(http://sportsunbiased.com/wp-content/uploads/2014/12/lebron-james.png) no-repeat center',
        'border-radius': '50%'
    },

    'div.action-buttons': {
        display: 'flex',
        'flex-flow': 'row nowrap',
        flex: '1 1 auto',
        'justify-content': 'space-between'
    },

    'div.button': ButtonStyle,

    'div.button:hover': {
        'background-color': 'rgba(0, 156, 180, 0.5)'
    },

    'div.button:active': {
        'background-color': 'rgba(0, 156, 180, 0.9)'
    }
};
},{"trio":4}]},{},[8])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvc3JjL2NvbnRyb2xsZXIvY29udHJvbGxlci5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvZXZlbnRCdXMvZXZlbnRCdXMuanMiLCIuLi9UcmluaXR5SlMvc3JjL2hlbHBlcnMvSWRHZW5lcmF0b3IuanMiLCIuLi9UcmluaXR5SlMvc3JjL2luZGV4LmpzIiwiLi4vVHJpbml0eUpTL3NyYy9tb2RlbC9tb2RlbC5qcyIsIi4uL1RyaW5pdHlKUy9zcmMvc3R5bGl6ZXIvc3R5bGl6ZXIuanMiLCIuLi9UcmluaXR5SlMvc3JjL3ZpZXcvdmlldy5qcyIsImNsaWVudC9zcmMvYXBwLmpzIiwiY2xpZW50L3NyYy9jb250cm9sbGVycy9oZWFkZXIvaW5kZXguanMiLCJjbGllbnQvc3JjL21vZGVscy9wbGF5ZXIvYmFzZVBsYXllci5qcyIsImNsaWVudC9zcmMvdmlld3MvaGVhZGVyL2luZGV4LmpzIiwiY2xpZW50L3NyYy92aWV3cy9oZWFkZXIvc3R5bGUvSGVhZGVyU3R5bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCdjb250cm9sbGVyJyk7XG52YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLnZpZXdFdmVudHMpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLnZpZXdFdmVudHNbZXZ0XTtcbiAgICAgICAgdmFyIGZuID0gdGhpc1toYW5kbGVyXSA9IHRoaXNbaGFuZGxlcl0uYmluZCh0aGlzKVxuICAgICAgICB0aGlzLnZpZXcuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLm1vZGVsRXZlbnRzKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5tb2RlbEV2ZW50c1tldnRdO1xuICAgICAgICB2YXIgZm4gPSB0aGlzW2hhbmRsZXJdID0gdGhpc1toYW5kbGVyXS5iaW5kKHRoaXMpXG4gICAgICAgIHRoaXMubW9kZWwuZXZlbnRCdXMuc3Vic2NyaWJlKGV2dCwgZm4pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlcjsiLCJ2YXIgRXZlbnRCdXMgPSBmdW5jdGlvbigpIHtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGlkID0gaWQ7XG4gICAgdmFyIGV2ZW50cyA9IHt9O1xuICAgIHRoaXMuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMucHVibGlzaCA9IGZ1bmN0aW9uKGV2ZW50LCBjdHgsIGFyZ3MpIHtcbiAgICAgICAgdGhpcy5fcHVibGlzaChldmVudCwgY3R4LCBhcmdzLCBldmVudHMpO1xuICAgIH07XG4gICAgdGhpcy51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgIHRoaXMuX3Vuc3Vic2NyaWJlKGV2ZW50LCBmdW5jLCBpZCwgZXZlbnRzKTtcbiAgICB9O1xuICAgIHRoaXMudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLl91bnN1YnNjcmliZUFsbChldmVudCwgaWQsIGV2ZW50cyk7XG4gICAgfVxufTtcblxuRXZlbnRCdXMucHJvdG90eXBlLl9zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIGlmICghZXZlbnRzW2V2ZW50XSkge1xuICAgICAgICBldmVudHNbZXZlbnRdID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFldmVudHNbZXZlbnRdW2lkXSkge1xuICAgICAgICBldmVudHNbZXZlbnRdW2lkXSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIGV2ZW50c1tldmVudF1baWRdLnB1c2goZnVuYyk7XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3B1Ymxpc2ggPSBmdW5jdGlvbihldmVudCwgY3R4LCBhcmdzLCBldmVudHMpIHtcbiAgICBjdHggPSBjdHggfHwgbnVsbDtcbiAgICBhcmdzID0gYXJncyB8fCBudWxsO1xuXG4gICAgdmFyIGV2ZW50QnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgIGlmIChldmVudEJ1Y2tldCkge1xuICAgICAgICBmb3IgKHZhciBidWNrZXQgaW4gZXZlbnRCdWNrZXQpIHtcbiAgICAgICAgICAgIHZhciBjYlF1ZXVlID0gZXZlbnRCdWNrZXRbYnVja2V0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNiUXVldWUpKSB7XG4gICAgICAgICAgICAgICAgY2JRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5fdW5zdWJzY3JpYmUgPSBmdW5jdGlvbihldmVudCwgZnVuYywgaWQsIGV2ZW50cykge1xuICAgIHZhciBidWNrZXQgPSBldmVudHNbZXZlbnRdO1xuXG4gICAgaWYgKGJ1Y2tldCkge1xuICAgICAgICB2YXIgcXVldWUgPSBidWNrZXRbaWRdO1xuXG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZm4sIGkpIHtcbiAgICAgICAgICAgIGlmKGZuID09PSBmdW5jKSB7XG4gICAgICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oZXZlbnQsIGlkLCBldmVudHMpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgdW5zdWJzcmliZU9uZShldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IFxuXG4gICAgZm9yICh2YXIgZXZ0IGluIGV2ZW50cykge1xuICAgICAgICB1bnN1YnNyaWJlT25lKGV2dCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5zdWJzcmliZU9uZShldmVudCkge1xuICAgICAgICB2YXIgYnVja2V0ID0gZXZlbnRzW2V2ZW50XTtcblxuICAgICAgICBpZiAoYnVja2V0ICYmIGJ1Y2tldFtpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBidWNrZXRbaWRdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1cztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIGNvdW50ID0gMTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkID0gc3RyICsgY291bnQ7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG59O1xuXG4iLCJ2YXIgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsL21vZGVsJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci9jb250cm9sbGVyJyk7XG52YXIgVmlldyA9IHJlcXVpcmUoJy4vdmlldy92aWV3Jyk7XG52YXIgU3R5bGl6ZXIgPSByZXF1aXJlKCcuL3N0eWxpemVyL3N0eWxpemVyJyk7XG5cbnZhciBUcmlvID0ge1xuICAgIE1vZGVsOiBNb2RlbCxcbiAgICBDb250cm9sbGVyOiBDb250cm9sbGVyLFxuICAgIFZpZXc6IFZpZXcsXG4gICAgU3R5bGl6ZXI6IFN0eWxpemVyXG59XG5cbmZvciAodmFyIGtleSBpbiBUcmlvKSB7XG4gICAgVHJpb1trZXldLmV4dGVuZCA9IGV4dGVuZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmlvO1xuXG5mdW5jdGlvbiBleHRlbmQobWV0aG9kcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9jb25zdHJ1Y3RvcjtcblxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc3RhdGljQXR0ciA9IHt9O1xuICAgIHZhciBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGljQXR0cikge1xuICAgICAgICAgICAgdGhpc1trZXldID0gc3RhdGljQXR0cltrZXldO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgXG4gICAgdmFyIGV4dGVuZGVkID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnQucHJvdG90eXBlLCBwcm9wKSkge1xuICAgICAgICAgICAgZXh0ZW5kZWRbcHJvcF0gPSBwYXJlbnQucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBtZXRob2RzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0aG9kcywgcHJvcCkpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJbcHJvcF0gPSBtZXRob2RzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShleHRlbmRlZCk7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMvZXZlbnRCdXMnKTtcbnZhciBJZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvSWRHZW5lcmF0b3InKSgnbW9kZWwnKTtcbnZhciBNb2RlbCA9IHt9O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5faW5pdGlhbGl6ZShvcHRzKTtcbn07XG5cbk1vZGVsLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmlkID0gSWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLmV2ZW50QnVzLnJlZ2lzdGVyKHRoaXMuaWQpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICB0aGlzLl9zZXQoa2V5LCB2YWwsIGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQoa2V5LCBhdHRyaWJ1dGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXR0cmlidXRlcykpO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQob3B0cyk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplJywgdGhpcywgb3B0cyk7XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9zZXQgPSBmdW5jdGlvbihrZXksIHZhbCwgYXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLl9zZXQoaywga2V5W2tdLCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSB2YWw7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgICAgIHRoaXMuZXZlbnRCdXMucHVibGlzaCgnY2hhbmdlJywgdGhpcywgcmV0KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2U6JyArIGtleSwgdGhpcywgdmFsKTtcbiAgICB9XG59O1xuXG5Nb2RlbC5fY29uc3RydWN0b3IucHJvdG90eXBlLl9nZXQgPSBmdW5jdGlvbihrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXNba2V5XTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xuIiwidmFyIFN0eWxpemVyID0ge307XG52YXIgbWl4aW5zID0ge307XG52YXIgdmFyaWFibGVzID0ge307XG5cblN0eWxpemVyLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIHJldCA9ICcnO1xuXG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gc3R5bGUpIHtcbiAgICAgICAgcmV0ICs9IHNlbGVjdG9yICsgJ3snO1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IHN0eWxlW3NlbGVjdG9yXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZyA9IHByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICByZXQgKz0gcHJvcCArICc6JyArIHNldHRpbmcgKyAnOyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gcmV0LnNsaWNlKDAsIHJldC5sZW5ndGggLSAxKTtcbiAgICAgICAgcmV0ICs9ICd9JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuU3R5bGl6ZXIucmVnaXN0ZXJNaXhpbnMgPSBmdW5jdGlvbihrZXksIGZ1bmMpIHtcbiAgICBtaXhpbnNba2V5XSA9IGZ1bmM7XG59O1xuXG5TdHlsaXplci5yZWdpc3RlclZhcmlhYmxlcyA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgdmFyaWFibGVzW2tleV0gPSB2YWw7XG59O1xuXG5TdHlsaXplci5nZXRWYXJpYWJsZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiB2YXJpYWJsZXNba2V5XTtcbn07XG5cblN0eWxpemVyLk1peGlucyA9IGZ1bmN0aW9uKGtleSwgb3B0cykge1xuICAgIGlmICghbWl4aW5zW2tleV0pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTWl4aW4gZm9yICcgKyBrZXkgKyAnIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIG1peGluc1trZXldLmNhbGwodGhpcywgb3B0cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxpemVyOyIsInZhciBFdmVudEJ1cyA9IHJlcXVpcmUoJy4uL2V2ZW50QnVzL2V2ZW50QnVzJyk7XG52YXIgU3R5bGl6ZXIgPSByZXF1aXJlKCcuLi9zdHlsaXplci9zdHlsaXplcicpO1xudmFyIElkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vaGVscGVycy9JZEdlbmVyYXRvcicpKCd2aWV3Jyk7XG52YXIgVmlldyA9IHt9O1xuXG5WaWV3Ll9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGU7XG4gICAgdmFyIHN0eWxlID0gdGhpcy5zdHlsZTtcblxuICAgIHRoaXMuaWQgPSBJZEdlbmVyYXRvcigpO1xuICAgIHRoaXMucmVmSW5kZXggPSB7fTtcblxuICAgIHRoaXMuZXZlbnRCdXMgPSBvcHRzLmV2ZW50QnVzIHx8IG5ldyBFdmVudEJ1cygpO1xuICAgIHRoaXMuZXZlbnRCdXMucmVnaXN0ZXIodGhpcy5pZCk7XG5cbiAgICBpZiAoc3R5bGUpIHtcbiAgICAgICAgdGhpcy5zdHlsZSA9IFN0eWxpemVyLnN0cmluZ2lmeShzdHlsZSk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlKSB7XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLnJlbmRlclRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVuZGVyVGVtcGxhdGUgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgIHZhciBlbCwgc3R5bGU7XG5cbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZS5pbm5lclRleHQgPSB0aGlzLnN0eWxlO1xuICAgIGVsLmFwcGVuZENoaWxkKHN0eWxlKTtcblxuICAgIGNyZWF0ZUVsZW1lbnRzLmNhbGwodGhpcywgdGVtcGxhdGUsIGVsKTtcblxuICAgIHJldHVybiBlbDtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRzKHRlbXBsYXRlLCBiYXNlKSB7XG4gICAgICAgIGZvciAodmFyIHRhZyBpbiB0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgaWYgKGlzVmFsaWRUYWcodGFnKSkge1xuICAgICAgICAgICAgICAgIHZhciBlbCA9IGNyZWF0ZU9uZUVsZW1lbnQuY2FsbCh0aGlzLCB0YWcpO1xuICAgICAgICAgICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgIGNyZWF0ZUVsZW1lbnRzLmNhbGwodGhpcywgdGVtcGxhdGVbdGFnXSwgZWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnID09PSAncmVmJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmSW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnID09PSAnb25DbGljaycpIHtcbiAgICAgICAgICAgICAgICBhZGRFdmVudHMuY2FsbCh0aGlzLCBiYXNlLCAnY2xpY2snICx0ZW1wbGF0ZVt0YWddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZU9uZUVsZW1lbnQodGFnKSB7XG4gICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZVRhZyh0YWcpO1xuICAgICAgICB2YXIgdGFnTmFtZSA9IHBhcnNlZFswXTtcblxuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuXG4gICAgICAgIGlmIChwYXJzZWRbMV0gPT09ICcuJykge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gcGFyc2VkWzJdO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnNlZFsxXSA9PT0gJyMnKSB7XG4gICAgICAgICAgICBlbC5pZCA9IHBhcnNlZFsyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFdmVudHMoZWwsIG9yaWdpbkV2dCwgbmV3RXZ0KSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIob3JpZ2luRXZ0LCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2gobmV3RXZ0LCB0aGlzLCBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiAodGFnWzFdID09PSAnIycgfHwgdGFnWzFdID09PSAnLicpICYmIHRhZy5sZW5ndGggPT09IDM7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmFwcGVuZENvbXBvbmVudFRvID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgdmFyIFJvb3QsIHJvb3QsIGNsb25lO1xuICAgIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICBcbiAgICBSb290ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHRoaXMudGFnTmFtZSwge1xuICAgICAgICBwcm90b3R5cGU6IHByb3RvXG4gICAgfSk7XG5cbiAgICByb290ID0gbmV3IFJvb3QoKVxuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHJvb3QpO1xuICAgIHRoaXMucm9vdCA9IHJvb3QuY3JlYXRlU2hhZG93Um9vdCgpO1xuICAgIHRoaXMucm9vdC5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcbiAgICBpZiAoIXRoaXMuaGFzQ2xhc3MoZWwsY2xhc3NOYW1lKSkge1xuICAgICAgICBlbC5jbGFzc05hbWUgKz0gXCIgXCIgKyBjbGFzc05hbWU7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICAgIGlmICh0aGlzLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkpIHtcbiAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrY2xhc3NOYW1lKycoXFxcXHN8JCknKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmVnLCcgJyk7XG4gICAgfVxufTtcblxuVmlldy5fY29uc3RydWN0b3IucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuICByZXR1cm4gISFlbC5jbGFzc05hbWUubWF0Y2gobmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbGFzc05hbWUrJyhcXFxcc3wkKScpKTtcbn07XG5cblZpZXcuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsID0gbnVsbDtcbiAgICB0aGlzLnJlZkluZGV4ID0ge307XG4gICAgdGhpcy5ldmVudEJ1cy51bnN1YnNjcmliZUFsbCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIiwidmFyIFRyaW8gPSByZXF1aXJlKCd0cmlvJyk7XG5cblRyaW8uU3R5bGl6ZXIucmVnaXN0ZXJWYXJpYWJsZXMoJ2J1dHRvbkJnQ29sb3InLCAnMCwgMTU2LCAxODAnKTtcblRyaW8uU3R5bGl6ZXIucmVnaXN0ZXJNaXhpbnMoJ2J1dHRvbicsIGZ1bmN0aW9uKG9wdHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWlnaHQ6ICcxMnB4JyxcbiAgICAgICAgd2lkdGg6IG9wdHMud2lkdGggfHwgJzYwcHgnLFxuICAgICAgICBwYWRkaW5nOiAnOHB4IDRweCcsXG4gICAgICAgIG1hcmdpbjogJzAgNHB4JyxcbiAgICAgICAgJ2ZvbnQtZmFtaWx5JzogJ0FyaWFsJyxcbiAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcxMnB4JyxcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAncmdiYSgnICsgVHJpby5TdHlsaXplci5nZXRWYXJpYWJsZSgnYnV0dG9uQmdDb2xvcicpICsgJywgMC43KScsXG4gICAgICAgICd0ZXh0LWFsaWduJzogJ2NlbnRlcicsXG4gICAgICAgICdib3JkZXItcmFkaXVzJzogJzJweCcsXG4gICAgICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJ1xuICAgIH1cbn0pO1xuXG52YXIgUGxheWVyID0gcmVxdWlyZSgnLi9tb2RlbHMvcGxheWVyL2Jhc2VQbGF5ZXInKTtcblxudmFyIEhlYWRlclZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL2hlYWRlcicpO1xudmFyIEhlYWRlckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL2hlYWRlcicpO1xuXG5cbnZhciBoZWFkZXIgPSBuZXcgSGVhZGVyQ29udHJvbGxlcih7XG4gICAgdmlldzogbmV3IEhlYWRlclZpZXcoe30pXG59KTsiLCJ2YXIgVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTtcblxudmFyIEhlYWRlckN0cmwgPSBUcmlvLkNvbnRyb2xsZXIuZXh0ZW5kKHtcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy52aWV3LnJlbmRlcigpO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ29tcG9uZW50VG8oZG9jdW1lbnQuYm9keSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSGVhZGVyQ3RybDsiLCJ2YXIgVHJpbyAgID0gcmVxdWlyZSgndHJpbycpO1xudmFyIFBsYXllciA9IFRyaW8uTW9kZWwuZXh0ZW5kKHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG4iLCJ2YXIgVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTtcbnZhciBIZWFkZXJTdHlsZSA9IHJlcXVpcmUoJy4vc3R5bGUvSGVhZGVyU3R5bGUnKTtcblxudmFyIEhlYWRlclZpZXcgPSBUcmlvLlZpZXcuZXh0ZW5kKHtcbiAgICB0YWdOYW1lOiAnaG9vcHMtaGVhZGVyJyxcblxuICAgIGJ1dHRvbk9wdGlvbnM6IFsnY2FsZW5kYXInLCAnbmV3cycsICdyb3N0ZXInLCAnZmluYW5jZSddLFxuXG4gICAgc3R5bGU6IEhlYWRlclN0eWxlLFxuXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgJ2Rpdi5pbmZvJyA6IHt9LFxuICAgICAgICAnZGl2LmFjdGlvbi1idXR0b25zJzoge1xuICAgICAgICAgICAgcmVmOiAnYnV0dG9uc0NvbnRhaW5lcicsXG4gICAgICAgICAgICAnZGl2LmJ1dHRvbic6IHtcbiAgICAgICAgICAgICAgICByZWY6ICdidXR0b25UbXBsJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAnZGl2LnByZWZlcmVuY2VzJzoge31cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJCdXR0b25zKCk7XG4gICAgfSxcblxuICAgIHJlbmRlckJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlZkluZGV4LmJ1dHRvbnNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG5cbiAgICAgICAgdGhpcy5idXR0b25PcHRpb25zLmZvckVhY2goIGZ1bmN0aW9uKGJ0bikge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHRoaXMucmVmSW5kZXguYnV0dG9uVG1wbC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmFkZENsYXNzKGJ1dHRvbiwgYnRuKTtcbiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IGJ0bjtcbiAgICAgICAgICAgIHRoaXMucmVmSW5kZXguYnV0dG9uc0NvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlclZpZXc7XG4iLCJ2YXIgVHJpbyA9IHJlcXVpcmUoJ3RyaW8nKTtcbnZhciBCdXR0b25TdHlsZSA9IFRyaW8uU3R5bGl6ZXIuTWl4aW5zKCdidXR0b24nLCB7d2lkdGg6ICcxMDAlJ30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnOmhvc3QnOiB7XG4gICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgIGhlaWdodDogJzUwcHgnLFxuICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICcjMzMzMzMzJyxcbiAgICAgICAgbWFyZ2luOiAnMCcsXG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgJ2ZsZXgtZmxvdyc6ICdyb3cgbm93cmFwJyxcbiAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcidcbiAgICB9LFxuXG4gICAgJ2Rpdi5pbmZvJzoge1xuICAgICAgICBoZWlnaHQ6ICczNnB4JyxcbiAgICAgICAgd2lkdGg6ICczNnB4JyxcbiAgICAgICAgbWFyZ2luOiAnNHB4JyxcbiAgICAgICAgYmFja2dyb3VuZDogJ3VybChodHRwOi8vc3BvcnRzdW5iaWFzZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE0LzEyL2xlYnJvbi1qYW1lcy5wbmcpIG5vLXJlcGVhdCBjZW50ZXInLFxuICAgICAgICAnYm9yZGVyLXJhZGl1cyc6ICc1MCUnXG4gICAgfSxcblxuICAgICdkaXYuYWN0aW9uLWJ1dHRvbnMnOiB7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgJ2ZsZXgtZmxvdyc6ICdyb3cgbm93cmFwJyxcbiAgICAgICAgZmxleDogJzEgMSBhdXRvJyxcbiAgICAgICAgJ2p1c3RpZnktY29udGVudCc6ICdzcGFjZS1iZXR3ZWVuJ1xuICAgIH0sXG5cbiAgICAnZGl2LmJ1dHRvbic6IEJ1dHRvblN0eWxlLFxuXG4gICAgJ2Rpdi5idXR0b246aG92ZXInOiB7XG4gICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3JnYmEoMCwgMTU2LCAxODAsIDAuNSknXG4gICAgfSxcblxuICAgICdkaXYuYnV0dG9uOmFjdGl2ZSc6IHtcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAncmdiYSgwLCAxNTYsIDE4MCwgMC45KSdcbiAgICB9XG59OyJdfQ==
