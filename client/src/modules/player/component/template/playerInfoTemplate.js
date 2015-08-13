Trio.Module.export('playerInfoTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div.avatar').append()
        .create('div.player-info')
            .each(attrTags)
                .create('div.attribute')
                    .create('div.tag').text(tagName).append()
                    .create('div.value').append()
                .append()
            .done()
        .append()
        .create('hoop-pie-container').addClass('stat-meter').append()
        .create('div').addClass('stat-wrapper').appendLast()

    return tmpl;

    function tagName(d) {
        return d;
    }

    function attrTags() {
        return ['POSITION','TEAM','MORALE','FATIGUE','SALARY','CONTRACT'];
    }
});