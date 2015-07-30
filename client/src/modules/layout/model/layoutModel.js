Trio.Module.export('layoutModel', function() {
    var LayoutModel = Trio.Model.extend({
        defaults: {
            x: 200,
            y: 50
        }
    });
    
    return LayoutModel;
});