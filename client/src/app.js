Trio.Module.import({
    'resources': './src/resources/index.js',
    'variables': './src/style/variables.js'
})

.and.import({
    'layoutModule': './src/modules/layout/layout.js',
    'playerModule': './src/modules/player/player.js'
})

.then(function(ret) {
    // var layout = ret.layoutModule;
    // var playerModule = ret.playerModule;
    // var baseModule = ret.baseModule;

    // var canvasEl;
    
    // layout.create();
    // layout.canvas.refIndex['canvas'].appendChild(playerModule.view.el);
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('table.test')
            .create('tr#header')
                .if('isShow')
                    .create('td#if').append()
                    .create('td#if').append()
                    .create('td#if').append()
                .else()
                    .create('td.else').text('yoyoyo').append()
                    .create('td.else').append()
                    .create('td').addClass('else').removeClass('else').append()
                .done()
                .each('results')
                    .create('td').text('hihi').append()
                .done()
            .append()
        .append()

    var el = tmpl.render({
        isShow: false,
        results: [1,2,3]
    });
    console.log(el, tmpl);

    function isShow(d) {
        return !d.isShow;
    }

    function results(d) {
        return d.results;
    }
});
