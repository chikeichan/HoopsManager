Trio.Module.export('miniInfoBoxTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div.mini-info-box')
            .create('div.title').append()
            .create('div.value').append()
        .appendLast()
        window.tmpl = tmpl
    return tmpl;
});