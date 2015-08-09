Trio.Module.export('layoutTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div#header')
            .create('div.row-resizable').append()
        .append()
        .create('div#main')
            .create('div#nav')
                .create('div.col-resizable').append()
            .append()
            .create('div#canvas')
        .append()
    .end();

    return tmpl;
});