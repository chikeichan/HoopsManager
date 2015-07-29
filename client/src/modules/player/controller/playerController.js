Trio.Module.export('playerController', function(done) {
    var PlayerController = Trio.Controller.extend({
        updateInfo: function() {
            var d = this.model.clone();
            this.view.render(d);
        }
    });

    done(PlayerController);
});