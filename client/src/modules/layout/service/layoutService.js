Trio.Module.export('layoutService', function() {

    var LayoutService = Trio.Service.extend({

        factoryEvents: {
            'change': 'render'
        },

        headerEvents: {
            'resizeY': 'resizeY'
        },

        navEvents: {
            'resizeX': 'resizeX'
        },

        isResizing: false,

        debounce: false,

        initialize: function(opts) {
            this.resized = this.resized.bind(this);
            this.resizing = this.resizing.bind(this);
            this.nav = opts.nav;
            this.canvas = opts.canvas;
            this.header = opts.header;
            this.factory = opts.factory;
            this.view = opts.view;

            this.subscribeAll(this.nav, this.navEvents);
            this.subscribeAll(this.header, this.headerEvents);
            this.subscribeAll(this.factory, this.factoryEvents);
        },

        create: function() {
            document.body.appendChild(this.view.el);
            this.render();
        },

        render: function() {
            var d = this.factory.clone();
            this.header.el.style['height'] = d.y + 'px';
            this.nav.el.style['width'] = d.x + 'px';
        },

        resizeY: function(ctx, e) {
            this._addEventListener();
            this.isResizing = 'y';
            this.header.el.style['backgroundColor'] = 'rgba(255, 255, 255, 1)';
        },

        resizeX: function(ctx, e) {
            this._addEventListener();
            this.isResizing = 'x';
            this.nav.el.style['backgroundColor'] = 'rgba(255, 255, 255, 0.8)';
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
            
            if (this.isResizing === 'x') {
                val = e.clientX;
                val = val > 300 ? 300 : val;
                val = val < 100 ? 100 : val;
                this.factory.set('x', val);
            } else if (this.isResizing === 'y') {
                val = e.clientY;
                val = val > 80 ? 80 : val;
                val = val < 50 ? 50 : val;
                this.factory.set('y', val);
            }

        },

        resized: function(e) {
            this._removeEventListener();
            this.isResizing = false;
            this.nav.el.style['backgroundColor'] = '';
            this.header.el.style['backgroundColor'] = '';
        }

    });

    return LayoutService;

});