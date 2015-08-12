Trio.Module.export('miniInfoBoxStyle', function() {
    var themeColor = Trio.Stylizer.getVariable('theme-color');
    var style = {
      ':host': {
          'color': 'white',
          'font-size': '16px',
          'margin': '4px'
      },
      '.mini-info-box': {
          'display': 'flex',
          'flex-direction': 'column',
          'background-color': themeColor,
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
          'padding': '8px 16px',
          'min-height': '16px',
          'min-width': '32px'
      },
      'div.value': {
          'display': 'flex',
          'margin': '0 4px',
          'background-color': themeColor,
          'flex-flow': 'column nowrap',
          'align-items': 'center',
          'border-radius': '2px',
          'padding': '8px 24px',
          'min-height': '16px',
          'min-width': '32px'
      }
    };

   return style;
});