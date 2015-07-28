Trio.import({
    'layoutModule': './src/modules/layout/layout.js'
})

.then(function(ret) {
    var layout = ret.layoutModule;


    layout.create();
});