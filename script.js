const power = document.querySelector('#power-value');
let base = 42.8;
setInterval(() => {
  base += (Math.random() - .5) * .6;
  power.textContent = base.toFixed(1);
}, 1800);
