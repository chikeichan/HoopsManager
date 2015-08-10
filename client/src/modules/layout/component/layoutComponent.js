Trio.Module.import({
    'layoutStyle'       : './src/modules/layout/component/style/layoutStyle.js',
    'layoutTemplate'    : './src/modules/layout/component/template/layoutTemplate.js'
})

.and.export('layoutComponent', function(ret) {
    var frag = ret.layoutTemplate.render();
    var style = Trio.Stylizer.createStyleTag(ret.layoutStyle);

    Trio.Component.register({
        tagName: 'hoop-layout',
        fragment: frag,
        style: style,
        events: {
            'mousedown .row-resizable': 'resizeY',
            'mousedown .col-resizable': 'resizeX'
        },
        onCreate: function() {
            this.resized    = this.resized.bind(this);
            this.resizing   = this.resizing.bind(this);
            this.nav        = this.shadowRoot.querySelector('#nav');
            this.header     = this.shadowRoot.querySelector('#header');
            this.canvas     = this.shadowRoot.querySelector('#canvas');
        },

        resizeY: function(e) {
            e.preventDefault();
            this.addResizeListeners();
            this.isResizing = 'y';
        },

        resizeX: function(e) {
            e.preventDefault();
            this.addResizeListeners();
            this.isResizing = 'x';
        },

        addResizeListeners: function() {
            document.addEventListener('mouseup', this.resized);
            document.addEventListener('mousemove', this.resizing);
        },

        removeResizeListeners: function() {
            document.removeEventListener('mouseup', this.resized);
            document.removeEventListener('mousemove', this.resizing);
        },

        resizing: function(e) {
            var val;
            if (this.isResizing === 'x') {
                val = e.clientX;
                val = val > 300 ? 300 : val;
                val = val < 100 ? 100 : val;
                this.setNav(val);
            } else if (this.isResizing === 'y') {
                val = e.clientY;
                val = val > 80 ? 80 : val;
                val = val < 50 ? 50 : val;
                this.setHeader(val);
            }
        },

        setNav: function(val) {
            this.navSize = val;
            this.nav.style.width = val + 'px';
        },

        setHeader: function(val) {
            this.headerSize = val;
            this.header.style.height = val + 'px';
        },

        resized: function(e) {
            var evt = new CustomEvent('resized', {
                detail: {
                    x: this.navSize,
                    y: this.headerSize
                }
            });
            this.dispatchEvent(evt);
            this.removeResizeListeners();
            this.isResizing = false;
        }
    });
});

