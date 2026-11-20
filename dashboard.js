const dialog = document.querySelector('#profile-dialog');
const nameInput = document.querySelector('#name-input');
const displayName = document.querySelector('#display-name');
const profileName = document.querySelector('#profile-name');
const initials = document.querySelector('#profile-initials');
const savedName = localStorage.getItem('astra-name');
function setName(name) {
  const clean = name.trim() || 'Alex';
  displayName.textContent = `${clean.split(' ')[0]}.`;
  profileName.textContent = clean;
  initials.textContent = clean.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();
  nameInput.value = clean;
}
setName(savedName || 'Alex Morgan');
document.querySelector('#profile-button').addEventListener('click', () => dialog.showModal());
dialog.querySelector('form').addEventListener('submit', () => { localStorage.setItem('astra-name', nameInput.value.trim() || 'Alex'); setName(nameInput.value); });
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
let value = 42.8;
setInterval(() => { value += (Math.random() - .5) * .45; document.querySelector('#demand').innerHTML = `${value.toFixed(1)} <small>kW</small>`; }, 1800);
