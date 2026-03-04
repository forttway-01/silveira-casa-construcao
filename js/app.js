/* =========================
   APP (Home) — carrega produtos do /data/products.json
   + render com foto
   ========================= */

// CONFIG: WhatsApp da loja (botão flutuante “falar no whats”)
const STORE_WHATS_E164 = "55SEUNUMEROAQUI"; // ex.: 554132898000

// Fonte do catálogo
const PRODUCTS_URL = "data/products.json";

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");
const chipsWrap = document.getElementById("categoryChips");

let PRODUCTS = [];
let activeCategory = "Todos";

function moneyBRL(v){
  return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function showToast(msg){
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window.__t);
  window.__t = setTimeout(() => toast.classList.remove("show"), 1700);
}

function uniqueCategories(){
  const set = new Set(PRODUCTS.map(p => p.category).filter(Boolean));
  return ["Todos", ...Array.from(set)];
}

function renderChips(){
  const cats = uniqueCategories();
  chipsWrap.innerHTML = cats.map(cat => `
    <button class="chip ${cat===activeCategory ? "active":""}" data-cat="${cat}">
      ${cat}
    </button>
  `).join("");
}

function matchesFilter(p){
  const q = (searchInput?.value || "").trim().toLowerCase();
  const catOk = activeCategory === "Todos" || p.category === activeCategory;
  const qOk = !q || (p.name||"").toLowerCase().includes(q) || (p.id||"").toLowerCase().includes(q);
  return catOk && qOk;
}

function renderProducts(){
  const items = PRODUCTS.filter(matchesFilter);

  if (!items.length){
    grid.innerHTML = `
      <div class="card" style="grid-column:1/-1;">
        Nenhum produto encontrado. Tente outro termo 🙂
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(p => `
    <article class="card">
      <div class="pImgWrap">
        <img class="pImg" src="${p.image || ""}" alt="${p.name || "Produto"}"
             loading="lazy"
             onerror="this.src='assets/products/placeholder.jpg'; this.onerror=null;" />
      </div>

      <p class="small">${p.category || ""}</p>
      <h3 class="pTitle">${p.name || ""}</h3>

      <div class="pMeta">
        <div class="price">${moneyBRL(p.price || 0)}</div>
        <div class="small">${p.id || ""}</div>
      </div>

      <div class="pActions">
        <button
          class="btn primary"
          data-add-to-cart
          data-id="${p.id}"
          data-name="${p.name}"
          data-price="${p.price}"
        >
          Adicionar
        </button>

        <a class="btn ghost" href="cart.html">Ver carrinho</a>
      </div>
    </article>
  `).join("");
}

async function loadProducts(){
  try {
    // cache-bust opcional (evita “produto novo não aparece” por cache)
    const url = `${PRODUCTS_URL}?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar catálogo: ${res.status}`);
    const data = await res.json();

    // validação leve
    PRODUCTS = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    PRODUCTS = [];
    grid.innerHTML = `
      <div class="card" style="grid-column:1/-1;">
        Não consegui carregar o catálogo. Verifique <b>/data/products.json</b>.
      </div>
    `;
  }
}

/* =========================
   INIT
   ========================= */
(async function init(){
  CartWhats.updateCartBadge();

  await loadProducts();
  renderChips();
  renderProducts();

  // Bind add-to-cart + toast
  CartWhats.bindAddToCart({
    onAdded: ({ name }) => showToast(`✅ Adicionado: ${name}`)
  });

  // Chips
  chipsWrap?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-cat]");
    if (!btn) return;
    activeCategory = btn.getAttribute("data-cat");
    renderChips();
    renderProducts();
  });

  // Busca
  searchInput?.addEventListener("input", () => renderProducts());

  // Whats float link
  const whatsFloat = document.getElementById("whatsFloat");
  if (whatsFloat) {
    const text = "Olá! Quero fazer um pedido. Pode me ajudar?";
    whatsFloat.href = `https://wa.me/${STORE_WHATS_E164}?text=${encodeURIComponent(text)}`;
  }
})();