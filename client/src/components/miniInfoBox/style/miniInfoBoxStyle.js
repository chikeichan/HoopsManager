Trio.Module.export('miniInfoBoxStyle', function() {
    var style = {
      ':host': {
          'color': 'white',
          'font-size': '16px',
          'margin': '4px'
      },
      '.mini-info-box': {
          'display': 'flex',
          'flex-direction': 'column',
          'background-color': 'rgba(0, 184, 255, 1)',
          'border-radius': '2px'
      },
      'div.title': {
          'display': 'flex',
          'color': 'white',
          'background-color': 'rgba(0, 0, 0, 0.7)',
          'flex-direction': 'column',
          'align-items': 'center',
          'border-top-right-radius': '2px',
          'border-top-left-radius': '2px',
          'padding': '8px 16px'
      },
      'div.value': {
          'display': 'flex',
          'margin': '0 4px',
          'background-color': 'rgba(0, 184, 255, 1)',
          'flex-flow': 'column nowrap',
          'align-items': 'center',
          'border-radius': '2px',
          'padding': '8px 24px'
      }
    };

   return style;
});