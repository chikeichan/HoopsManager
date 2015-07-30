Trio.Module.export('layoutController', function() {

    var LayoutController = Trio.Controller.extend({

        viewEvents: {
            'resizeY': 'resizeY',
            'resizeX': 'resizeX'
        },

        modelEvents: {
            'change': 'render'
        },

        isResizing: false,

        debounce: false,

        initialize: function() {
            this.resized = this.resized.bind(this);
            this.resizing = this.resizing.bind(this);
        },

        create: function() {
            document.body.appendChild(this.view.el);
            this.render();
        },

        render: function() {
            var d = this.model.clone();
            this.view.render(d);
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