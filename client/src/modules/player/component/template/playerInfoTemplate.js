Trio.Module.export('playerInfoTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div.avatar').append()
        .create('div.player-info')
            .each(getAttributes)
                .create('div.attribute')
                    .create('div.tag').text(tagName).append()
                    .create('div.value').append()
                .append()
            .done()
        .append()
        .create('hoop-pie-container').addClass('stat-meter').appendLast()

    return tmpl;

    function tagName(d) {
        return d;
    }

    function getAttributes(d) {
        return d;
    }
});