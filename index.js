/* ── index.js — Lógica de la portada LAPA ── */

// NAVBAR SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// MENÚ HAMBURGUESA (MOBILE)
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// SCROLL REVEAL
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// SMOOTH SCROLL para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ICONO FLOTANTE — tip aleatorio
const floatingIcon = document.getElementById('floatingIcon');
const tips = [
  '¡Bienvenido a ,LAPA! 😉',
  '¡Pide el Platón ,LAPA! 🔥',
  '¿Ya probaste nuestros frappes? ☕',
  '¡Música en vivo los viernes! 🎸',
];
let tipIndex = 0;
floatingIcon.addEventListener('click', () => {
  const tip = document.createElement('div');
  tip.className = 'icon-tip';
  tip.textContent = tips[tipIndex++ % tips.length];
  document.body.appendChild(tip);
  const rect = floatingIcon.getBoundingClientRect();
  tip.style.cssText = `
    position: fixed;
    bottom: ${window.innerHeight - rect.top + 8}px;
    left: ${rect.left}px;
    background: var(--gold);
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: .78rem;
    font-weight: 700;
    padding: 8px 14px;
    border-radius: 20px 20px 20px 4px;
    z-index: 9999;
    white-space: nowrap;
    box-shadow: 0 4px 20px rgba(200,155,60,.5);
    animation: tipFadeOut .3s ease .1s both;
    pointer-events: none;
  `;
  setTimeout(() => tip.remove(), 2800);
});
const tipStyle = document.createElement('style');
tipStyle.textContent = `
  @keyframes tipFadeOut {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(tipStyle);
