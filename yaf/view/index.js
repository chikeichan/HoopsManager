var EventBus = require('../eventBus');
var View = {};

View._constructor = function(opts) {
    this._initialize(opts);
};

View._constructor.prototype._initialize = function(opts) {
    this.refIndex = {};

    this.eventBus = opts.eventBus || new EventBus();

    if(typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
    }
};

View._constructor.prototype.renderTmpl = function(tag, template) {
    var el;

    template = template || this.template;

    if (!tag) {
        el = document.createElement(this.tagName);

        if (this.className) {
            el.className = this.className;
        }

        if (this.style['root']) {
            addStyle(el, this.style['root']);
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
                if (this.style[tag]) {
                    addStyle(el, this.style[tag]);
                }
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
        return tag !== 'style' && tag !== 'ref' && tag !== 'onClick';
    }
};

module.exports = View;
