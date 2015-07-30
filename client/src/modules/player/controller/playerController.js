Trio.Module.export('playerController', function() {
    var PlayerController = Trio.Controller.extend({
        updateInfo: function() {
            var d = this.model.clone();
            this.view.render(d);
        }
    });

    return PlayerController;
});