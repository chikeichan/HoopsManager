Trio.Module.export('layoutController', function(done) {

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
            document.addEventListener('mouseup', this.resized.bind(this));
            document.addEventListener('mousemove', this.resizing.bind(this));
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
            this.isResizing = 'y';
        },

        resizeX: function(ctx, e) {
            this.isResizing = 'x';
        },

        resizing: function(e) {
            var val;

            if (this.debounce) {
                return;
            }
            
            this.debounce = true;

            setTimeout(function() {
                this.debounce = false;
            }.bind(this), 30)

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
            this.isResizing = false;
        }

    });

    done(LayoutController);

});