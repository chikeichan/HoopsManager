Trio.Module.export('pieContainerStyle', function() {
    var style = {
      ':host': {
        'display': 'flex',
        'flex-direction': 'column',
        'justify-content': 'center'
      },
      '.pie-wrapper': {
        'position': 'relative',
        'box-sizing': 'border-box',
        'width': '150px',
        'height': '150px',
        'background-color': '#2E2E2F',
        'border-radius': '50%',
        'border': '5px solid black'
      },

      '.pie': {
        'width': '50%',
        'height': '100%',
        'transform-origin': '100% 50%',
        'position': 'absolute',
        'background': 'rgba(0, 184, 255, 1)',
      },

      '.spinner, .mask': {
        'border-radius': '100% 0 0 100% / 50% 0 0 50%',
        'z-index': '200',
        'border-right': 'none'
      },

      '.spinner': {
        'transform': 'rotate(0deg)'
      },

      '.mask': {
          'opacity': '1',
          'background-color': '#2E2E2F'
      },

      '.filler': {
        'border-radius': '0 100% 100% 0 / 0 50% 50% 0',
        'left': '50%',
        'opacity': '0',
        'z-index': '100',
        'border-left': 'none',
      },

      '.content': {
          'position': 'absolute',
          'background-color': 'black',
          'width': 'calc(100% - 16px)',
          'height': 'calc(100% - 16px)',
          'top': '8px',
          'left': '8px',
          'z-index': '400',
          'border-radius': '50%',
          'text-align': 'center',
          'color': 'white',
          'font-size': '60px',
          'font-weight': 'bold',
          'line-height': '124px',
      }
    };

   return style;
});