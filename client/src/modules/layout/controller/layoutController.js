Trio.export('layoutController', function(done) {
    var LayoutController = Trio.Controller.extend({

        viewEvents: {
            'resize': 'resize'
        },

        modelEvents: {
            'change': 'render'
        },

        initialize: function() {
            this.view.appendComponentTo(document.body);
            this.render();
        },

        render: function() {
            var d = this.model.read();
            this.view.refIndex.header.style.height = '' + d.y + 'px';
            this.view.refIndex.nav.style.width = '' + d.x + 'px';
        },

        resize: function(ctx, e) {
            console.log(e)
        }

    });

    done(LayoutController);
});