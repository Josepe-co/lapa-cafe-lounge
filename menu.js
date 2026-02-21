/* ================================================================
   LAPA Café-Lounge — menu.js
   Carrito, modales, filtros y envío por WhatsApp
================================================================ */

const WA_NUMBER = "529631337896";

/* ─────────────────────────────────────────────────────────────
   ESTADO GLOBAL
───────────────────────────────────────────────────────────── */
let cart = [];   // { key, id, name, variant, price, qty }

// Variante temporal (modal de variante)
let vm = {
  id: '', name: '', basePrice: 0,
  variants: [],           // [{label, price}] o ['string']
  selectedIdx: 0,
  qty: 1
};

/* ─────────────────────────────────────────────────────────────
   FILTRO DE CATEGORÍAS
───────────────────────────────────────────────────────────── */
document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const cat = pill.dataset.cat;
    document.querySelectorAll('.menu-section').forEach(sec => {
      sec.classList.toggle('hidden', sec.dataset.cat !== cat);
    });
    // scroll al top del main suavemente
    document.querySelector('.menu-main').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ─────────────────────────────────────────────────────────────
   CARRITO — UTILIDADES
───────────────────────────────────────────────────────────── */
function cartKey(id, variant) {
  return `${id}__${variant}`;
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const fab   = document.getElementById('fabCart');
  const badge = document.getElementById('fabBadge');
  if (total > 0) {
    fab.style.display = 'flex';
    badge.textContent = total;
    badge.style.animation = 'none';
    void badge.offsetWidth;
    badge.style.animation = 'badge-pop .3s cubic-bezier(.17,.67,.3,1.33) both';
  } else {
    fab.style.display = 'none';
  }
}

function calcCartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/* ─────────────────────────────────────────────────────────────
   AGREGAR AL CARRITO (producto simple)
───────────────────────────────────────────────────────────── */
function addToCart(id, name, price, variant = '') {
  const key = cartKey(id, variant);
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 20);
  } else {
    cart.push({ key, id, name, variant, price, qty: 1 });
  }
  updateCartBadge();
  showAddFeedback(event?.currentTarget);
}

/* ─────────────────────────────────────────────────────────────
   AGREGAR ALITAS (con salsa seleccionada)
───────────────────────────────────────────────────────────── */
function addWingsToCart(id, name, price) {
  const sauce = document.querySelector('input[name="sauce"]:checked')?.value || 'Sin salsa';
  const variantLabel = `Salsa: ${sauce}`;
  const key = cartKey(id, sauce);
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 20);
  } else {
    cart.push({ key, id, name, variant: variantLabel, price, qty: 1 });
  }
  updateCartBadge();
  showAddFeedback(event?.currentTarget);
}

/* Feedback visual al agregar */
function showAddFeedback(btn) {
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = '✓ Agregado';
  btn.style.background = '#3a8a3a';
  btn.style.color = '#fff';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.color = '';
  }, 1200);
}

/* ─────────────────────────────────────────────────────────────
   MODAL DE VARIANTE
───────────────────────────────────────────────────────────── */
function openVariantModal(id, name, basePrice, variants) {
  vm.id       = id;
  vm.name     = name;
  vm.basePrice = basePrice;
  vm.variants = variants.map(v =>
    typeof v === 'string' ? { label: v, price: basePrice } : v
  );
  vm.selectedIdx = 0;
  vm.qty = 1;

  document.getElementById('variantTitle').textContent = name;
  renderVariantOptions();
  updateVariantSubtotal();

  const overlay = document.getElementById('variantOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderVariantOptions() {
  const container = document.getElementById('variantOptions');
  container.innerHTML = vm.variants.map((v, i) => `
    <div class="variant-opt ${i === vm.selectedIdx ? 'active' : ''}" onclick="selectVariant(${i})">
      <span class="variant-opt-name">${v.label}</span>
      <span class="variant-opt-price">$${v.price}</span>
    </div>
  `).join('');
}

function selectVariant(idx) {
  vm.selectedIdx = idx;
  renderVariantOptions();
  updateVariantSubtotal();
}

function changeVariantQty(delta) {
  vm.qty = Math.min(Math.max(1, vm.qty + delta), 20);
  document.getElementById('variantQty').textContent = vm.qty;
  updateVariantSubtotal();
}

function updateVariantSubtotal() {
  const price = vm.variants[vm.selectedIdx]?.price || 0;
  document.getElementById('variantSubtotal').textContent = `$${price * vm.qty}`;
}

function confirmVariant() {
  const chosen = vm.variants[vm.selectedIdx];
  const key = cartKey(vm.id, chosen.label);
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty = Math.min(existing.qty + vm.qty, 20);
  } else {
    cart.push({
      key, id: vm.id, name: vm.name,
      variant: chosen.label,
      price: chosen.price,
      qty: vm.qty
    });
  }
  updateCartBadge();
  closeVariantModal();
}

function closeVariantModal() {
  document.getElementById('variantOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────────────
   MODAL DEL CARRITO
───────────────────────────────────────────────────────────── */
document.getElementById('fabCart').addEventListener('click', openCartModal);

/* Delegación de eventos para botones del carrito (se registra una sola vez) */
document.getElementById('cartItems').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const key    = btn.dataset.key;
  const action = btn.dataset.action;
  if (action === 'del') removeCartItem(key);
  else if (action === 'dec') changeCartQty(key, -1);
  else if (action === 'inc') changeCartQty(key,  1);
});

function openCartModal() {
  renderCartItems();
  updateCartTotal();
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('cartError').textContent = '';
}

function closeCartModal() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const empty     = document.getElementById('cartEmpty');

  if (cart.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'flex';
    document.getElementById('btnSendWA').disabled = true;
    return;
  }

  empty.style.display = 'none';
  document.getElementById('btnSendWA').disabled = false;
  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
        <div class="cart-item-unit">$${item.price} c/u</div>
      </div>
      <div class="cart-item-qty">
        <button data-action="dec" data-key="${item.key}">−</button>
        <span>${item.qty}</span>
        <button data-action="inc" data-key="${item.key}">+</button>
      </div>
      <div class="cart-item-total">$${item.price * item.qty}</div>
      <button class="cart-item-del" data-action="del" data-key="${item.key}" title="Eliminar">✕</button>
    </div>
  `).join('');
}

function changeCartQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  const newQty = item.qty + delta;

  if (newQty <= 0) {
    removeCartItem(key);
    return;
  }

  item.qty = Math.min(newQty, 20);
  updateCartBadge();
  updateCartTotal();

  // Actualizar en-lugar (sin re-renderizar toda la lista)
  const row = document.querySelector(`.cart-item[data-key="${key}"]`);
  if (!row) return;
  const qtySpan  = row.querySelector('.cart-item-qty span');
  const totalDiv = row.querySelector('.cart-item-total');
  if (qtySpan)  qtySpan.textContent  = item.qty;
  if (totalDiv) totalDiv.textContent = `$${item.price * item.qty}`;

  // Animación bump al agregar
  if (delta > 0 && qtySpan) {
    qtySpan.classList.remove('bump');
    void qtySpan.offsetWidth;
    qtySpan.classList.add('bump');
  }
}

function removeCartItem(key) {
  const el = document.querySelector(`.cart-item[data-key="${key}"]`);
  const doRemove = () => {
    const idx = cart.findIndex(i => i.key === key);
    if (idx !== -1) cart.splice(idx, 1);
    updateCartBadge();
    renderCartItems();
    updateCartTotal();
  };
  if (el) {
    el.classList.add('removing');
    el.addEventListener('animationend', doRemove, { once: true });
  } else {
    doRemove();
  }
}

function updateCartTotal() {
  document.getElementById('cartTotal').textContent = `$${calcCartTotal()}`;
}

/* ─────────────────────────────────────────────────────────────
   ENVÍO POR WHATSAPP
───────────────────────────────────────────────────────────── */
function sendToWhatsApp() {
  // Validar carrito
  if (cart.length === 0) {
    showCartError('🛒 Agrega al menos un producto antes de enviar.');
    return;
  }

  const mesaNum = document.getElementById('mesaNum').value.trim();
  const notes   = document.getElementById('cartNotes').value.trim();

  // Validar número de mesa
  if (!mesaNum) {
    const input = document.getElementById('mesaNum');
    input.classList.add('error');
    input.focus();
    setTimeout(() => input.classList.remove('error'), 1000);
    showCartError('📍 Por favor ingresa el número de mesa.');
    return;
  }

  clearCartError();

  // Construir mensaje
  const itemLines = cart.map((item, i) => {
    const variantStr = item.variant ? ` — ${item.variant}` : '';
    return `${i + 1}. *${item.name}*${variantStr} × ${item.qty} = $${item.price * item.qty}`;
  }).join('\n');

  const locationLine = `🪑 *Mesa número: ${mesaNum}*`;
  const totalLine    = `💰 *Total: $${calcCartTotal()}*`;
  const notesLine    = notes ? `📝 *Notas:* ${notes}` : '';

  const msg = [
    `¡Hola! 😄 Quiero hacer un pedido en *LAPA Café-Lounge*:\n`,
    itemLines,
    '',
    locationLine,
    totalLine,
    notesLine
  ].filter(Boolean).join('\n');

  // Animación en botón
  const btn = document.getElementById('btnSendWA');
  btn.textContent = '✓ ¡Enviando!';
  btn.style.background = '#3a8a3a';

  setTimeout(() => {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Limpiar
    cart = [];
    updateCartBadge();
    document.getElementById('cartNotes').value = '';
    document.getElementById('mesaNum').value = '';
    closeCartModal();

    btn.textContent = 'Enviar pedido por WhatsApp';
    btn.style.background = '';
  }, 900);
}

function showCartError(msg) {
  document.getElementById('cartError').textContent = msg;
}
function clearCartError() {
  document.getElementById('cartError').textContent = '';
}

/* ─────────────────────────────────────────────────────────────
   CIERRE POR OVERLAY CLICK / ESC
───────────────────────────────────────────────────────────── */
document.getElementById('variantOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeVariantModal();
});
document.getElementById('cartOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeCartModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeVariantModal();
    closeCartModal();
  }
});

/* ─────────────────────────────────────────────────────────────
   ICONO FLOTANTE — TIP
───────────────────────────────────────────────────────────── */
const floatingIcon = document.getElementById('floatingIcon');
const tips = [
  '☕ ¿Ya pediste tu frappe?',
  '� ¡Prueba el Platón LAPA!',
  '🍔 La hamburguesa LAPA es increíble',
  '🎸 ¡Viernes hay música en vivo!',
];
let tipIdx = 0;
floatingIcon.addEventListener('click', () => {
  const tip = document.createElement('div');
  tip.textContent = tips[tipIdx++ % tips.length];
  Object.assign(tip.style, {
    position: 'fixed',
    bottom: '100px',
    left: '20px',
    background: 'var(--gold)',
    color: '#000',
    fontFamily: 'Poppins, sans-serif',
    fontSize: '.78rem',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: '2px',
    zIndex: '9999',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 20px rgba(200,155,60,.5)',
    pointerEvents: 'none',
    opacity: '0',
    transform: 'translateY(6px)',
    transition: 'opacity .2s ease, transform .2s ease'
  });
  document.body.appendChild(tip);
  requestAnimationFrame(() => {
    tip.style.opacity = '1';
    tip.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    tip.style.opacity = '0';
    setTimeout(() => tip.remove(), 300);
  }, 2500);
});

/* ─────────────────────────────────────────────────────────────
   INICIALIZACIÓN
───────────────────────────────────────────────────────────── */
// Limpiar error de mesa al escribir
document.getElementById('mesaNum').addEventListener('input', clearCartError);
