Trio.Module.export('layoutStyle', function() {
    var style = {
       ':host': {
           'display': 'flex',
           'flex': '1 1 auto',
           'width': '100%',
           'height': '100%',
           'flex-flow': 'column nowrap'
       },
       '#header': {
           'display': 'flex',
           'background-color': Trio.Stylizer.getVariable('header-color'),
           'width': '100%',
           'height': '100px',
           'flex-shrink': '0'
       },
       '#nav': {
           'display': 'flex',
           'background-color': Trio.Stylizer.getVariable('base-color'),
           'width': '100px',
           'flex-shrink': '0'
       },
       '#canvas': {
           'display': 'flex',
           'background-color': Trio.Stylizer.getVariable('canvas-color'),
           'width': '100%',
           'overflow': 'auto'
       },
       '#main': {
           'display': 'flex',
           'flex': '1 1 auto',
           'flex-flow': 'row nowrap',
           'height': '100%'
       },
       'div.row-resizable': Trio.Stylizer.getVariable('row-resizable'),
       'div.col-resizable': Trio.Stylizer.getVariable('col-resizable')
   };

   return style;
});