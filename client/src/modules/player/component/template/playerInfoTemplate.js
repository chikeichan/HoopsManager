Trio.Module.export('playerInfoTemplate', function() {
    var tmpl = Trio.Renderer.createTemplate();

    tmpl.create('div.avatar').style('background-image', getURL).append()
        .create('div.attributes')
            .each(getAttributes)
                .create('div.attribute')
                    .create('div.tag').text(tagName).append()
                    .create('div.value').text(tagValue).append()
                .append()
            .done()
        .appendLast()

    return tmpl;

    function tagName(d) {
        return d.name;
    }

    function tagValue(d) {
        return d.val;
    }

    function getAttributes(d) {
        return d.attributes;
    }

    function getURL(d) {
        return 'url(' + d.avatarUrl + ')';
    }
});