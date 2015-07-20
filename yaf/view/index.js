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
