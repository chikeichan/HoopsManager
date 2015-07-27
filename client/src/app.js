Trio.import({
    'layoutModule': './src/modules/layout/layout.js'
})

.then(function(ret) {
        var layout = ret.layoutModule;
        console.log(layout)
});