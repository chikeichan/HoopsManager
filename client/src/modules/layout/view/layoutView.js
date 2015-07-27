Trio.export('layoutView', function(done) {
    var LayoutView = Trio.View.extend({
        tagName: 'hoop-layout',

        style: {
            'div.header': {
                'display': 'flex',
                'background-color': '#3E3E3E',
                'width': '100%',
                'height': '100%',
                'cursor': 'row-resize'
            },
            'div.nav': {
                'display': 'flex',
                'background-color': '#5F5F5F',
                'width': '100%',
                'cursor': 'col-resize'
            },
            'div.canvas': {
                'display': 'flex',
                'background-color': '#999999',
                'width': '100%',
            },
            'div.main': {
                'display': 'flex',
                'flex': '1 1 auto',
                'flex-flow': 'row nowrap',
                'height': '100%'
            }
        },

        template: {
            'div.header': {
                ref: 'header'
            },
            'div.main': {
                'div.nav': {
                    ref: 'nav'
                },
                'div.canvas': {}
            }
        }
    });
    done(LayoutView);
});