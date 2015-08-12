Trio.Module.export('playerMiniBoxTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('hoop-mini-info-box').addClass('age').append()
        .create('hoop-mini-info-box').addClass('height').append()
        .create('hoop-mini-info-box').addClass('weight').append()
        .create('hoop-mini-info-box').addClass('from').append()

    return tmpl;
});