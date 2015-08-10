Trio.Module.export('baseModuleTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div.header')
            .create('div.title').append()
            .create('div.sub-header').append()
        .append()
        .create('div.content').append()
        .create('div.footer').appendLast()

    return tmpl;
});