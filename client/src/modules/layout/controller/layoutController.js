Trio.Module.export('layoutController', function() {

    var LayoutController = Trio.Controller.extend({

        modelEvents: {
            'change': 'render'
        },

        isResizing: false,

        debounce: false,

        initialize: function(opts) {
            this.resized = this.resized.bind(this);
            this.resizing = this.resizing.bind(this);
            this.nav = opts.nav;
            this.canvas = opts.canvas;
            this.header = opts.header;

            this.header.eventBus.subscribe('resizeY', this.resizeY.bind(this));
            this.nav.eventBus.subscribe('resizeX', this.resizeX.bind(this));
        },

        create: function() {
            document.body.appendChild(this.view.el);
            this.render();
        },

        render: function() {
            var d = this.model.clone();
            this.header.el.style['height'] = d.y + 'px';
            this.nav.el.style['width'] = d.x + 'px';
        },

        resizeY: function(ctx, e) {
            this._addEventListener();
            this.isResizing = 'y';
        },

        resizeX: function(ctx, e) {
            this._addEventListener();
            this.isResizing = 'x';
        },

        _addEventListener: function() {
            document.addEventListener('mouseup', this.resized);
            document.addEventListener('mousemove', this.resizing);
        },

        _removeEventListener: function() {
            document.removeEventListener('mouseup', this.resized);
            document.removeEventListener('mousemove', this.resizing);
        },

        resizing: function(e) {
            var val;
            
            this.debounce = true;

            if (this.isResizing === 'x') {
                val = e.clientX;
                val = val > 300 ? 300 : val;
                val = val < 100 ? 100 : val;
                this.model.set('x', val);
            } else if (this.isResizing === 'y') {
                val = e.clientY;
                val = val > 80 ? 80 : val;
                val = val < 50 ? 50 : val;
                this.model.set('y', val);
            }

        },

        resized: function(e) {
            this._removeEventListener();
            this.isResizing = false;
        }

    });

    return LayoutController;

});