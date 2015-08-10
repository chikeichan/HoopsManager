Trio.Module.export('baseModuleStyle', function() {
    var style = {
       ':host': {
          'display': 'flex',
          'flex-flow': 'column nowrap',
          'background-color': 'rgba(255,255,255,0.25)',
          'width': '100%',
          'height': '100%',
          'margin': '8px'
        },

        '.header': {
          'display': 'flex',
          'background-color': 'rgba(0, 0, 0, 0.5)',
          'margin': '8px 0',
          'align-items': 'center',
          'flex-flow': 'row nowrap',
          'height': '58px',
        },

        '.title': {
            'color': 'white',
            'padding': '12px 24px',
            'text-transform': 'uppercase',
            'display': 'flex',
            'flex': '1 1 auto',
            'font-size': '30px',
            'align-items': 'center'
        },

        '.sub-header': {
            'display': 'flex',
            'margin-left': '8px'
        },

        '.content': {
          'display': 'flex',
          'width': '100%',
          'min-height': '100px',
          'margin': '8px'
        },
        
        '.jersey-number': {
          'color': 'rgba(0, 184, 255, 1)',
          'font-size': '40px',
          'margin': '0 4px',
          'font-weight': 'bold'
        }
   };

   return style;
});