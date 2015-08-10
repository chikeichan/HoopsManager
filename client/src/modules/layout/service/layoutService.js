Trio.Module.export('layoutService', function() {

    var LayoutService = Trio.Service.extend({
        initialize: function(opts) {
            this.component = opts.component;
            this.factory   = opts.factory;
            this.updateSize(this.factory.clone());
            this.component.addEventListener('resized', this.updateViewConfig.bind(this));
            document.body.appendChild(opts.component);
        },
        appendToHeader: function(el) {
            this.component.header.appendChild(el);
        },
        appendToNav: function(el) {
            this.component.nav.appendChild(el);
        },
        appendToCanvas: function(el) {
            this.component.canvas.appendChild(el);
        },
        updateSize: function(key, val) {
            key = typeof key === 'string' ? key.toLowerCase() : key;
            if (key === 'x') {
                this.component.setNav(val);
            } else if (key === 'y') {
                this.component.setHeader(val);
            } else if (typeof key === 'object') {
                this.component.setNav(key.x);
                this.component.setHeader(key.y);
            }
        },
        updateViewConfig: function(e) {
            this.factory.set(e.detail);
        }
    });

    return LayoutService;

});