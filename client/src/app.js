window.p = Trio.Vow();

setTimeout(function() {
    p.resolve(1);
}, 5000);

p.promise
  .then(plusOne)
  .then(plusOne)
  .then(plusOne)
  .then(plusOne)

function plusOne(num) {
    console.log(num);
    return num + 1;
}