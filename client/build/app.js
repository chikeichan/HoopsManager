(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Yaf = require('../../yaf')
var Player = require('./models/player/basePlayer');


},{"../../yaf":5,"./models/player/basePlayer":2}],2:[function(require,module,exports){
var Player = Yaf.Model.extend({});

var testModel = new Player({
    height: 62,
    weight: 178,
    name: 'Jacky Chan'
});

var PlayerCtrl = Yaf.Controller.extend({
    events: {
        'click height': 'addHeight',
        'click weight': 'subtractWeight'
    },

    initialize: function() {
        this.view.updateInfo(this.model.attributes);

        this.model.eventBus.subscribe('changed', function(a) {
            this.view.updateInfo(this.model.attributes);
        }.bind(this));
    },

    addHeight: function() {
        var height = this.model.get('height');
        this.model.set('height', height + 1);
    },

    subtractWeight: function() {
        var weight = this.model.get('weight');
        this.model.set('weight', weight - 1);
    }
});

var textStyle = {
    'font-family': 'arial',
    margin: '4px 12px',
    'font-size': '12px'
}

var PlayerView = Yaf.View.extend({
    tagName: 'div',
    className: 'player',
    template: {
        'div.avatar': {
            style: {
                width: '50px',
                height: '50px',
                backgroundColor: 'blue',
                borderRadius: '50%'
            }
        },

        'div.info' : {
            'p#name': {
                ref: 'name',
                style: textStyle
            },
            'p#height': {
                ref: 'height',
                style: textStyle
            },
            'p#weight': {
                ref: 'weight',
                style: textStyle
            }
        },

        style: {
            width: '200px',
            height: '100px',
            backgroundColor: 'white',
            border: '1px solid black',
            display: 'flex',
            'flex-flow': 'row nowrap',
            padding: '8px'
        }
    },

    initialize: function() {
        this.render();
    },

    render: function() {
        this.el = this.renderTmpl();
    },

    updateInfo: function(opts) {
        this.refIndex['name'].textContent = opts.name;
        this.refIndex['height'].textContent = opts.height;
        this.refIndex['weight'].textContent = opts.weight;
    }
})

var testView = new PlayerView({});

document.body.appendChild(testView.el)

var testController = new PlayerCtrl({
    model: testModel,
    view: testView
});

module.exports = Player;

},{}],3:[function(require,module,exports){
var Controller = {};

Controller._constructor = function(opts) {
    this._initialize(opts);
};

Controller._constructor.prototype._initialize = function(opts) {
    this.model = opts.model || null;
    this.view = opts.view || null;

    if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }

    this._addEventListeners();
};

Controller._constructor.prototype._addEventListeners = function() {
    for (var evt in this.events) {
        var parsed = evt.split(' ');
        var evtName = parsed[0];
        var evtEl   = this.view.refIndex[parsed[1]];
        var evtFn   = this[this.events[evt]] = this[this.events[evt]].bind(this);
        
        evtEl.addEventListener(evtName, evtFn);
    }
};

module.exports = Controller;
},{}],4:[function(require,module,exports){
var EventBus = function() {
    this._events = {};
};

EventBus.prototype.subscribe = function(event, func) {
    if (!this._events[event]) {
        this._events[event] = [];
    }

    if (typeof func !== 'function') {
        throw new Error('A callback function must be passed in to subscribe');
    }
    
    this._events[event].push(func);
};

EventBus.prototype.publish = function(event, ctx, args) {
    ctx = ctx || null;
    args = args || null;

    var cbQueue = this._events[event];

    if (Array.isArray(cbQueue)) {
        cbQueue.forEach(function(cb) {
            cb.call(this, ctx, args);
        });
    }
};

module.exports = EventBus;
},{}],5:[function(require,module,exports){
var Model = require('./model');
var Controller = require('./controller');
var View = require('./view');

var Yaf = {
    Model: Model,
    Controller: Controller,
    View: View
}


for (var key in Yaf) {
    Yaf[key].extend = extend;
}

module.exports = Yaf;

function extend(methods) {
    var parent = this._constructor;
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
},{"./controller":3,"./model":6,"./view":7}],6:[function(require,module,exports){
var EventBus = require('../eventBus');
var Model = {};

Model._constructor = function(opts) {
    this.attributes = {};
    this._initialize(opts);
};

Model._constructor.prototype._initialize = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }

    this.set(opts);
    this.eventBus.publish('initialized', this, opts);
};

Model._constructor.prototype.set = function(key, val) {
    if (typeof key === 'object' && !Array.isArray(key)) {
        for (var k in key) {
            this.set(k, key[k]);
        }
    }

    if (typeof key === 'string') {
        this.attributes[key] = val;
        this.eventBus.publish('changed', this, {key: val});
        this.eventBus.publish('changed:' + key, this, val);
    }
};

Model._constructor.prototype.get = function(key) {
    if (typeof key === 'string') {
        return this.attributes[key];
    }
};

module.exports = Model;
},{"../eventBus":4}],7:[function(require,module,exports){
var EventBus = require('../eventBus');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    this.refIndex = {};
    this.el = document.createElement(this.tagName);

    if(this.className) {
        this.el.className = this.className;
    }

    this.refIndex['root'] = this.el;

    this.eventBus = opts.eventBus || new EventBus();
    this.tagName = opts.tagName || 'div';
    this.className = opts.className || null;

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.renderTmpl = function(tag, template) {
    var el;

    template = template || this.template;

    if (!tag) {
        el = document.createElement(this.tagName);

        if(this.className) {
            el.className = this.className;
        }
    } else {
        el = createOneElement(tag);
    }

    createElements.call(this, template, el);

    return el;

    function createElements(template, base) {
        for (var tag in template) {
            if (isValidTag(tag)) {
                var el = createOneElement(tag);
                base.appendChild(el)
                createElements.call(this, template[tag], el);
            }

            if (tag === 'style') {
                addStyle(base, template[tag]);
            }

            if (tag === 'ref') {
                this.refIndex[template[tag]] = base;
            }
        }
    }

    function createOneElement(tag) {
        var parsed = parseTag(tag);
        var tagName = parsed[0];

        var el = document.createElement(tagName)

        if (parsed[1] === '.') {
            el.className = parsed[2];
        } else if (parsed[1] === '#') {
            el.id = parsed[2];
        }

        return el;
    }

    function addStyle(el, style) {
        for (var attr in style) {
            el.style[attr] = style[attr];
        }
    }

    function parseTag(tag) {
        tag = tag.replace(/[.#]/, function(d) { return ',' + d + ','})
                 .split(',');
        return tag;
    }

    function isValidTag(tag) {
        return tag !== 'style' && tag !== 'ref';
    }
};

module.exports = View;

},{"../eventBus":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvc3JjL2FwcC5qcyIsImNsaWVudC9zcmMvbW9kZWxzL3BsYXllci9iYXNlUGxheWVyLmpzIiwieWFmL2NvbnRyb2xsZXIvaW5kZXguanMiLCJ5YWYvZXZlbnRCdXMvaW5kZXguanMiLCJ5YWYvaW5kZXguanMiLCJ5YWYvbW9kZWwvaW5kZXguanMiLCJ5YWYvdmlldy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIllhZiA9IHJlcXVpcmUoJy4uLy4uL3lhZicpXG52YXIgUGxheWVyID0gcmVxdWlyZSgnLi9tb2RlbHMvcGxheWVyL2Jhc2VQbGF5ZXInKTtcblxuIiwidmFyIFBsYXllciA9IFlhZi5Nb2RlbC5leHRlbmQoe30pO1xuXG52YXIgdGVzdE1vZGVsID0gbmV3IFBsYXllcih7XG4gICAgaGVpZ2h0OiA2MixcbiAgICB3ZWlnaHQ6IDE3OCxcbiAgICBuYW1lOiAnSmFja3kgQ2hhbidcbn0pO1xuXG52YXIgUGxheWVyQ3RybCA9IFlhZi5Db250cm9sbGVyLmV4dGVuZCh7XG4gICAgZXZlbnRzOiB7XG4gICAgICAgICdjbGljayBoZWlnaHQnOiAnYWRkSGVpZ2h0JyxcbiAgICAgICAgJ2NsaWNrIHdlaWdodCc6ICdzdWJ0cmFjdFdlaWdodCdcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudmlldy51cGRhdGVJbmZvKHRoaXMubW9kZWwuYXR0cmlidXRlcyk7XG5cbiAgICAgICAgdGhpcy5tb2RlbC5ldmVudEJ1cy5zdWJzY3JpYmUoJ2NoYW5nZWQnLCBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcudXBkYXRlSW5mbyh0aGlzLm1vZGVsLmF0dHJpYnV0ZXMpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBhZGRIZWlnaHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5tb2RlbC5nZXQoJ2hlaWdodCcpO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnaGVpZ2h0JywgaGVpZ2h0ICsgMSk7XG4gICAgfSxcblxuICAgIHN1YnRyYWN0V2VpZ2h0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHdlaWdodCA9IHRoaXMubW9kZWwuZ2V0KCd3ZWlnaHQnKTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ3dlaWdodCcsIHdlaWdodCAtIDEpO1xuICAgIH1cbn0pO1xuXG52YXIgdGV4dFN0eWxlID0ge1xuICAgICdmb250LWZhbWlseSc6ICdhcmlhbCcsXG4gICAgbWFyZ2luOiAnNHB4IDEycHgnLFxuICAgICdmb250LXNpemUnOiAnMTJweCdcbn1cblxudmFyIFBsYXllclZpZXcgPSBZYWYuVmlldy5leHRlbmQoe1xuICAgIHRhZ05hbWU6ICdkaXYnLFxuICAgIGNsYXNzTmFtZTogJ3BsYXllcicsXG4gICAgdGVtcGxhdGU6IHtcbiAgICAgICAgJ2Rpdi5hdmF0YXInOiB7XG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAnNTBweCcsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnNTBweCcsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnYmx1ZScsXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNTAlJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgICdkaXYuaW5mbycgOiB7XG4gICAgICAgICAgICAncCNuYW1lJzoge1xuICAgICAgICAgICAgICAgIHJlZjogJ25hbWUnLFxuICAgICAgICAgICAgICAgIHN0eWxlOiB0ZXh0U3R5bGVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncCNoZWlnaHQnOiB7XG4gICAgICAgICAgICAgICAgcmVmOiAnaGVpZ2h0JyxcbiAgICAgICAgICAgICAgICBzdHlsZTogdGV4dFN0eWxlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3Ajd2VpZ2h0Jzoge1xuICAgICAgICAgICAgICAgIHJlZjogJ3dlaWdodCcsXG4gICAgICAgICAgICAgICAgc3R5bGU6IHRleHRTdHlsZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICB3aWR0aDogJzIwMHB4JyxcbiAgICAgICAgICAgIGhlaWdodDogJzEwMHB4JyxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCBibGFjaycsXG4gICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAnZmxleC1mbG93JzogJ3JvdyBub3dyYXAnLFxuICAgICAgICAgICAgcGFkZGluZzogJzhweCdcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lbCA9IHRoaXMucmVuZGVyVG1wbCgpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVJbmZvOiBmdW5jdGlvbihvcHRzKSB7XG4gICAgICAgIHRoaXMucmVmSW5kZXhbJ25hbWUnXS50ZXh0Q29udGVudCA9IG9wdHMubmFtZTtcbiAgICAgICAgdGhpcy5yZWZJbmRleFsnaGVpZ2h0J10udGV4dENvbnRlbnQgPSBvcHRzLmhlaWdodDtcbiAgICAgICAgdGhpcy5yZWZJbmRleFsnd2VpZ2h0J10udGV4dENvbnRlbnQgPSBvcHRzLndlaWdodDtcbiAgICB9XG59KVxuXG52YXIgdGVzdFZpZXcgPSBuZXcgUGxheWVyVmlldyh7fSk7XG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGVzdFZpZXcuZWwpXG5cbnZhciB0ZXN0Q29udHJvbGxlciA9IG5ldyBQbGF5ZXJDdHJsKHtcbiAgICBtb2RlbDogdGVzdE1vZGVsLFxuICAgIHZpZXc6IHRlc3RWaWV3XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG4iLCJ2YXIgQ29udHJvbGxlciA9IHt9O1xuXG5Db250cm9sbGVyLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMubW9kZWwgPSBvcHRzLm1vZGVsIHx8IG51bGw7XG4gICAgdGhpcy52aWV3ID0gb3B0cy52aWV3IHx8IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycygpO1xufTtcblxuQ29udHJvbGxlci5fY29uc3RydWN0b3IucHJvdG90eXBlLl9hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGV2dCBpbiB0aGlzLmV2ZW50cykge1xuICAgICAgICB2YXIgcGFyc2VkID0gZXZ0LnNwbGl0KCcgJyk7XG4gICAgICAgIHZhciBldnROYW1lID0gcGFyc2VkWzBdO1xuICAgICAgICB2YXIgZXZ0RWwgICA9IHRoaXMudmlldy5yZWZJbmRleFtwYXJzZWRbMV1dO1xuICAgICAgICB2YXIgZXZ0Rm4gICA9IHRoaXNbdGhpcy5ldmVudHNbZXZ0XV0gPSB0aGlzW3RoaXMuZXZlbnRzW2V2dF1dLmJpbmQodGhpcyk7XG4gICAgICAgIFxuICAgICAgICBldnRFbC5hZGRFdmVudExpc3RlbmVyKGV2dE5hbWUsIGV2dEZuKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7IiwidmFyIEV2ZW50QnVzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG59O1xuXG5FdmVudEJ1cy5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldmVudF0pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IFtdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gbXVzdCBiZSBwYXNzZWQgaW4gdG8gc3Vic2NyaWJlJyk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuX2V2ZW50c1tldmVudF0ucHVzaChmdW5jKTtcbn07XG5cbkV2ZW50QnVzLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24oZXZlbnQsIGN0eCwgYXJncykge1xuICAgIGN0eCA9IGN0eCB8fCBudWxsO1xuICAgIGFyZ3MgPSBhcmdzIHx8IG51bGw7XG5cbiAgICB2YXIgY2JRdWV1ZSA9IHRoaXMuX2V2ZW50c1tldmVudF07XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShjYlF1ZXVlKSkge1xuICAgICAgICBjYlF1ZXVlLmZvckVhY2goZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgIGNiLmNhbGwodGhpcywgY3R4LCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEJ1czsiLCJ2YXIgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlcicpO1xudmFyIFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxudmFyIFlhZiA9IHtcbiAgICBNb2RlbDogTW9kZWwsXG4gICAgQ29udHJvbGxlcjogQ29udHJvbGxlcixcbiAgICBWaWV3OiBWaWV3XG59XG5cblxuZm9yICh2YXIga2V5IGluIFlhZikge1xuICAgIFlhZltrZXldLmV4dGVuZCA9IGV4dGVuZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBZYWY7XG5cbmZ1bmN0aW9uIGV4dGVuZChtZXRob2RzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX2NvbnN0cnVjdG9yO1xuICAgIHZhciBzdGF0aWNBdHRyID0ge307XG4gICAgdmFyIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzdGF0aWNBdHRyKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSBzdGF0aWNBdHRyW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgZXh0ZW5kZWQgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcGFyZW50LnByb3RvdHlwZSkge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmVudC5wcm90b3R5cGUsIHByb3ApKSB7XG4gICAgICAgICAgICBleHRlbmRlZFtwcm9wXSA9IHBhcmVudC5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG1ldGhvZHMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXRob2RzLCBwcm9wKSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGV4dGVuZGVkW3Byb3BdID0gbWV0aG9kc1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cltwcm9wXSA9IG1ldGhvZHNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGV4dGVuZGVkKTtcblxuICAgIHJldHVybiBjaGlsZDtcbn0iLCJ2YXIgRXZlbnRCdXMgPSByZXF1aXJlKCcuLi9ldmVudEJ1cycpO1xudmFyIE1vZGVsID0ge307XG5cbk1vZGVsLl9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLl9pbml0aWFsaXplKG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcblxuICAgIGlmKHR5cGVvZiB0aGlzLmluaXRpYWxpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQob3B0cyk7XG4gICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdpbml0aWFsaXplZCcsIHRoaXMsIG9wdHMpO1xufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4ga2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNldChrLCBrZXlba10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1trZXldID0gdmFsO1xuICAgICAgICB0aGlzLmV2ZW50QnVzLnB1Ymxpc2goJ2NoYW5nZWQnLCB0aGlzLCB7a2V5OiB2YWx9KTtcbiAgICAgICAgdGhpcy5ldmVudEJ1cy5wdWJsaXNoKCdjaGFuZ2VkOicgKyBrZXksIHRoaXMsIHZhbCk7XG4gICAgfVxufTtcblxuTW9kZWwuX2NvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlc1trZXldO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7IiwidmFyIEV2ZW50QnVzID0gcmVxdWlyZSgnLi4vZXZlbnRCdXMnKTtcbnZhciBWaWV3ID0ge307XG5cblZpZXcuX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ob3B0cykge1xuICAgIHRoaXMuX2luaXRpYWxpemUob3B0cyk7XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihvcHRzKSB7XG4gICAgdGhpcy5yZWZJbmRleCA9IHt9O1xuICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnTmFtZSk7XG5cbiAgICBpZih0aGlzLmNsYXNzTmFtZSkge1xuICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lO1xuICAgIH1cblxuICAgIHRoaXMucmVmSW5kZXhbJ3Jvb3QnXSA9IHRoaXMuZWw7XG5cbiAgICB0aGlzLmV2ZW50QnVzID0gb3B0cy5ldmVudEJ1cyB8fCBuZXcgRXZlbnRCdXMoKTtcbiAgICB0aGlzLnRhZ05hbWUgPSBvcHRzLnRhZ05hbWUgfHwgJ2Rpdic7XG4gICAgdGhpcy5jbGFzc05hbWUgPSBvcHRzLmNsYXNzTmFtZSB8fCBudWxsO1xuXG4gICAgaWYodHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG5WaWV3Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUucmVuZGVyVG1wbCA9IGZ1bmN0aW9uKHRhZywgdGVtcGxhdGUpIHtcbiAgICB2YXIgZWw7XG5cbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlIHx8IHRoaXMudGVtcGxhdGU7XG5cbiAgICBpZiAoIXRhZykge1xuICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy50YWdOYW1lKTtcblxuICAgICAgICBpZih0aGlzLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBlbCA9IGNyZWF0ZU9uZUVsZW1lbnQodGFnKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlLCBlbCk7XG5cbiAgICByZXR1cm4gZWw7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50cyh0ZW1wbGF0ZSwgYmFzZSkge1xuICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChpc1ZhbGlkVGFnKHRhZykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBjcmVhdGVPbmVFbGVtZW50KHRhZyk7XG4gICAgICAgICAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbClcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cy5jYWxsKHRoaXMsIHRlbXBsYXRlW3RhZ10sIGVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRhZyA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgICAgIGFkZFN0eWxlKGJhc2UsIHRlbXBsYXRlW3RhZ10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFnID09PSAncmVmJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmSW5kZXhbdGVtcGxhdGVbdGFnXV0gPSBiYXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT25lRWxlbWVudCh0YWcpIHtcbiAgICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlVGFnKHRhZyk7XG4gICAgICAgIHZhciB0YWdOYW1lID0gcGFyc2VkWzBdO1xuXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSlcblxuICAgICAgICBpZiAocGFyc2VkWzFdID09PSAnLicpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IHBhcnNlZFsyXTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJzZWRbMV0gPT09ICcjJykge1xuICAgICAgICAgICAgZWwuaWQgPSBwYXJzZWRbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU3R5bGUoZWwsIHN0eWxlKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHIgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGVsLnN0eWxlW2F0dHJdID0gc3R5bGVbYXR0cl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRhZyh0YWcpIHtcbiAgICAgICAgdGFnID0gdGFnLnJlcGxhY2UoL1suI10vLCBmdW5jdGlvbihkKSB7IHJldHVybiAnLCcgKyBkICsgJywnfSlcbiAgICAgICAgICAgICAgICAgLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWYWxpZFRhZyh0YWcpIHtcbiAgICAgICAgcmV0dXJuIHRhZyAhPT0gJ3N0eWxlJyAmJiB0YWcgIT09ICdyZWYnO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiJdfQ==
