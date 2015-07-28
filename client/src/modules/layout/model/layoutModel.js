Trio.Module.export('layoutModel', function(done) {
    var LayoutModel = Trio.Model.extend({
        defaults: {
            x: 200,
            y: 50
        }
    });
    
    done(LayoutModel);
});