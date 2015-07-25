var p = new Trio.Vow();

setTimeout(function() {
    p.resolve('hi');
}, 5000);

p.then(function(arg) {
    console.log(arg);
    return 'two';
})

p.then(function(arg) {
    console.log(arg);
})