Trio.Module.export('layoutFactory', function() {
    var LayoutFactory = Trio.Factory.extend({
        defaults: {
            x: 200,
            y: 50
        }
    });
    
    return LayoutFactory;
});