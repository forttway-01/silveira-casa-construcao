/* =========================
   CART ENGINE (LocalStorage)
   + Checkout WhatsApp
   ========================= */

const CART_KEY = "whats_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function moneyBRL(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function upsertItem({ id, name, price, qty = 1 }) {
  const cart = loadCart();
  const idx = cart.items.findIndex((it) => it.id === id);

  if (idx >= 0) cart.items[idx].qty += qty;
  else cart.items.push({ id, name, price, qty });

  cart.items = cart.items.filter((it) => it.qty > 0);
  saveCart(cart);
  return cart;
}

function setQty(id, qty) {
  const cart = loadCart();
  const idx = cart.items.findIndex((it) => it.id === id);
  if (idx >= 0) {
    cart.items[idx].qty = Math.max(1, qty);
    saveCart(cart);
  }
  return cart;
}

function removeItem(id) {
  const cart = loadCart();
  cart.items = cart.items.filter((it) => it.id !== id);
  saveCart(cart);
  return cart;
}

function clearCart() {
  saveCart({ items: [] });
}

function cartTotals(cart = loadCart()) {
  const total = cart.items.reduce((acc, it) => acc + it.price * it.qty, 0);
  return { total };
}

function updateCartBadge(selector = "[data-cart-badge]") {
  const el = document.querySelector(selector);
  if (!el) return;

  const cart = loadCart();
  const count = cart.items.reduce((acc, it) => acc + it.qty, 0);
  el.textContent = String(count);
}

/* =========================
   PRODUCTS: bind add-to-cart
   ========================= */
function bindAddToCart({
  buttonSelector = "[data-add-to-cart]",
  onAdded = () => {},
} = {}) {
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest(buttonSelector);
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const name = btn.getAttribute("data-name");
    const price = Number(btn.getAttribute("data-price") || "0");

    if (!id || !name || !Number.isFinite(price)) return;

    upsertItem({ id, name, price, qty: 1 });
    updateCartBadge();
    onAdded({ id, name, price });
  });
}

/* =========================
   CART PAGE: render + controls
   ========================= */
function renderCart({
  listSelector = "[data-cart-list]",
  summarySelector = "[data-cart-summary]",
  emptySelector = "[data-cart-empty]",
} = {}) {
  const listEl = document.querySelector(listSelector);
  const summaryEl = document.querySelector(summarySelector);
  const emptyEl = document.querySelector(emptySelector);

  if (!listEl || !summaryEl) return;

  const cart = loadCart();

  if (!cart.items.length) {
    listEl.innerHTML = "";
    summaryEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    updateCartBadge();
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  listEl.innerHTML = cart.items.map((it) => {
    const sub = it.price * it.qty;
    return `
      <div class="cItem" data-item="${it.id}">
        <div>
          <div class="cTitle">${it.name}</div>
          <div class="cMeta">
            <span class="pill">${moneyBRL(it.price)} / un</span>
            <span class="pill">Subtotal: <b>${moneyBRL(sub)}</b></span>
          </div>
        </div>

        <div class="cActions">
          <button class="btn ghost" data-dec="${it.id}">−</button>
          <input class="qty" type="number" min="1" value="${it.qty}" data-qty="${it.id}" />
          <button class="btn ghost" data-inc="${it.id}">+</button>
          <button class="btn danger" data-remove="${it.id}">Remover</button>
        </div>
      </div>
    `;
  }).join("");

  const { total } = cartTotals(cart);
  summaryEl.innerHTML = `<div class="sumRow"><span>Total</span><b>${moneyBRL(total)}</b></div>`;

  updateCartBadge();
}

function bindCartControls() {
  document.addEventListener("click", (ev) => {
    const inc = ev.target.closest("[data-inc]");
    const dec = ev.target.closest("[data-dec]");
    const rm = ev.target.closest("[data-remove]");

    if (inc) {
      const id = inc.getAttribute("data-inc");
      const cart = loadCart();
      const it = cart.items.find((x) => x.id === id);
      if (it) setQty(id, it.qty + 1);
      renderCart();
    }

    if (dec) {
      const id = dec.getAttribute("data-dec");
      const cart = loadCart();
      const it = cart.items.find((x) => x.id === id);
      if (it) setQty(id, it.qty - 1);
      renderCart();
    }

    if (rm) {
      const id = rm.getAttribute("data-remove");
      removeItem(id);
      renderCart();
    }
  });

  document.addEventListener("change", (ev) => {
    const qtyInput = ev.target.closest("[data-qty]");
    if (!qtyInput) return;

    const id = qtyInput.getAttribute("data-qty");
    const qty = Math.max(1, Number(qtyInput.value || "1"));
    setQty(id, qty);
    renderCart();
  });
}

/* =========================
   CHECKOUT: WhatsApp message
   ========================= */
function checkoutWhatsApp({
  phoneE164 = "55SEUNUMEROAQUI",
  customerFormSelector = "[data-customer-form]",
} = {}) {
  const cart = loadCart();
  if (!cart.items.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const form = document.querySelector(customerFormSelector);
  const name = form?.querySelector("[name='name']")?.value?.trim() || "";
  const address = form?.querySelector("[name='address']")?.value?.trim() || "";
  const note = form?.querySelector("[name='note']")?.value?.trim() || "";

  const { total } = cartTotals(cart);

  const lines = [];
  lines.push("🧾 *Novo pedido do site*");
  if (name) lines.push(`👤 Cliente: ${name}`);
  if (address) lines.push(`📍 Entrega/Retirada: ${address}`);
  lines.push("");
  lines.push("*Itens:*");

  cart.items.forEach((it, i) => {
    const sub = it.price * it.qty;
    lines.push(`${i + 1}) ${it.name}`);
    lines.push(`   Qtd: ${it.qty} | Un: ${moneyBRL(it.price)} | Sub: ${moneyBRL(sub)}`);
  });

  lines.push("");
  lines.push(`💰 *Total: ${moneyBRL(total)}*`);

  if (note) {
    lines.push("");
    lines.push(`📝 Obs: ${note}`);
  }

  lines.push("");
  lines.push("✅ Pode confirmar disponibilidade e prazo?");

  let text = lines.join("\n");
  const MAX = 3500;
  if (text.length > MAX) text = text.slice(0, MAX - 60) + "\n\n(…lista resumida por limite)";

  const url = `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// Expor API global
window.CartWhats = {
  loadCart, saveCart,
  upsertItem, setQty, removeItem, clearCart,
  cartTotals, updateCartBadge,
  bindAddToCart, renderCart, bindCartControls,
  checkoutWhatsApp,
};