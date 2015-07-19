var EventBus = require('../eventBus');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    this.eventBus = opts.eventBus || new EventBus();

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.render = function() {
    var element = {};
    var index = {};
    var tagName = this.tagName || 'div';
    var className = this.className || null;

    element = {
        el: document.createElement(tagName),
    };

    if(className) {
        element.el.className = className;
    }

    index['root'] = element.el;

    createElements(this.template, element);

    this.el = element.el;
    this.index = index;

    return this;

    function createElements(template, base) {
        for (var tag in template) {
            if (isValidTag(tag)) {
                base[tag] = createOneElement(tag);
                base.el.appendChild(base[tag].el);
                createElements(template[tag], base[tag]);
            }

            if (tag === 'style') {
                addStyle(base.el, template[tag]);
            }

            if (tag === 'ref') {
                index[template[tag]] = base.el;
            }
        }
    }

    function createOneElement(tag) {
        var parsed = parseTag(tag);
        var tagName = parsed[0];

        var base = {
            el: document.createElement(tagName)
        }

        if (parsed[1] === '.') {
            base.el.className = parsed[2];
        } else if (parsed[1] === '#') {
            base.el.id = parsed[2];
        }

        return base;
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