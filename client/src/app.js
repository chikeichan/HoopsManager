var a = Trio.import('layoutView', './src/modules/layout/view/layoutView.js');
Trio.start(function() {
    var gEventBus = Trio.getGlobalEventBus(); 
    console.log('Starting...', gEventBus);

});