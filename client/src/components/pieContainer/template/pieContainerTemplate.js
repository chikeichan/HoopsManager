Trio.Module.export('pieContainerTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div.pie-wrapper')
            .create('div.spinner').addClass('pie').append()
            .create('div.filler').addClass('pie').append()
            .create('div.mask').addClass('pie').append()
            .create('div.content').append()
        .appendLast()

    return tmpl;
});