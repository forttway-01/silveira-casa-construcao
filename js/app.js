/* =========================
   APP (Home) — Ordenação + Ofertas automáticas
   ========================= */

const STORE_WHATS_E164 = "55SEUNUMEROAQUI"; // ex.: 554132898000
const PRODUCTS_URL = "data/products.json";

const grid = document.getElementById("productGrid");
const offerGrid = document.getElementById("offerGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const toast = document.getElementById("toast");

let PRODUCTS = [];

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

async function loadProducts(){
  try{
    const url = `${PRODUCTS_URL}?v=${Date.now()}`;
    const res = await fetch(url, { cache:"no-store" });
    if(!res.ok) throw new Error(`Falha ao carregar catálogo: ${res.status}`);
    const data = await res.json();
    PRODUCTS = Array.isArray(data) ? data : [];
  }catch(err){
    console.error(err);
    PRODUCTS = [];
  }
}

function calcDiscountPercent(oldPrice, price){
  const o = Number(oldPrice);
  const p = Number(price);
  if(!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p <= 0 || o <= p) return "";
  const pct = Math.round(((o - p) / o) * 100);
  return pct > 0 ? `${pct}% OFF` : "";
}
function calcSavings(oldPrice, price){
  const o = Number(oldPrice);
  const p = Number(price);
  if(!Number.isFinite(o) || !Number.isFinite(p) || o <= p) return 0;
  return +(o - p).toFixed(2);
}

function isRealOffer(p){
  return p?.isOffer === true && Number(p.oldPrice) > Number(p.price);
}

/* =========================
   SORT + FILTER
   ========================= */
function getQuery(){
  return (searchInput?.value || "").trim().toLowerCase();
}

function baseFiltered(){
  const q = getQuery();
  return PRODUCTS.filter(p => {
    if (!p) return false;
    if (!q) return true;
    return (p.name||"").toLowerCase().includes(q) || (p.id||"").toLowerCase().includes(q);
  });
}

function sortItems(items){
  const mode = sortSelect?.value || "best";

  const byName = (a,b) => (a.name||"").localeCompare(b.name||"");
  const byLow = (a,b) => Number(a.price||0) - Number(b.price||0);
  const byHigh = (a,b) => Number(b.price||0) - Number(a.price||0);

  if (mode === "az") return [...items].sort(byName);
  if (mode === "low") return [...items].sort(byLow);
  if (mode === "high") return [...items].sort(byHigh);

  if (mode === "offers"){
    // ofertas primeiro, depois por nome
    return [...items].sort((a,b) => {
      const ao = isRealOffer(a) ? 1 : 0;
      const bo = isRealOffer(b) ? 1 : 0;
      if (bo !== ao) return bo - ao;
      return byName(a,b);
    });
  }

  // "best" (mais vendidos) — usa campo sold, padrão 0
  return [...items].sort((a,b) => {
    const as = Number(a.sold || 0);
    const bs = Number(b.sold || 0);
    if (bs !== as) return bs - as;
    // desempate: ofertas primeiro, depois nome
    const ao = isRealOffer(a) ? 1 : 0;
    const bo = isRealOffer(b) ? 1 : 0;
    if (bo !== ao) return bo - ao;
    return byName(a,b);
  });
}

/* =========================
   OFERTAS
   ========================= */
function renderOffers(){
  if (!offerGrid) return;

  const offers = PRODUCTS.filter(isRealOffer).slice(0,6);

  if (!offers.length){
    offerGrid.innerHTML = `
      <div class="offerCard" style="grid-column:1/-1;">
        <h3 style="margin:0 0 6px;">Sem ofertas no momento</h3>
        <p style="margin:0;color:rgba(35,31,32,.68);">
          Marque produtos com <b>"isOffer": true</b> e <b>"oldPrice"</b> maior que o preço.
        </p>
      </div>
    `;
    return;
  }

  offerGrid.innerHTML = offers.map(p => {
    const pct = calcDiscountPercent(p.oldPrice, p.price);
    const savings = calcSavings(p.oldPrice, p.price);

    return `
      <div class="offerCard">
        <span class="offerBadge">OFERTA</span>
        ${pct ? `<span class="offerPct">${pct}</span>` : ``}

        <div class="offerImgWrap">
          <img class="offerImg" src="${p.image || ""}" alt="${p.name || "Produto"}"
               loading="lazy"
               onerror="this.style.display='none';" />
        </div>

        <h3>${p.name || ""}</h3>

        <div class="oldPrice">De: ${moneyBRL(p.oldPrice)}</div>

        <div class="priceLine">
          <span class="priceLabel">Por:</span>
          <span class="priceNow">${moneyBRL(p.price || 0)}</span>
        </div>

        ${savings>0 ? `<div class="saveLine">Você economiza <b>${moneyBRL(savings)}</b></div>` : ``}

        <button class="btn primary"
          data-add-to-cart
          data-id="${p.id}"
          data-name="${p.name}"
          data-price="${p.price}">
          Adicionar
        </button>
      </div>
    `;
  }).join("");
}

/* =========================
   GRID PRODUTOS
   ========================= */
function renderProducts(){
  if (!grid) return;

  const items = sortItems(baseFiltered());

  if (!items.length){
    grid.innerHTML = `<div class="card" style="grid-column:1/-1;">Nenhum produto encontrado.</div>`;
    return;
  }

  grid.innerHTML = items.map(p => {
    const offer = isRealOffer(p);
    const pct = offer ? calcDiscountPercent(p.oldPrice, p.price) : "";
    const savings = offer ? calcSavings(p.oldPrice, p.price) : 0;

    return `
      <article class="card ${offer ? "cardOffer" : ""}">
        ${offer ? `
          <div class="cardBadges">
            <span class="badgeChip">OFERTA</span>
            ${pct ? `<span class="badgeChip pct">${pct}</span>` : ``}
          </div>` : ``}

        <div class="pImgWrap">
          <img class="pImg" src="${p.image || ""}" alt="${p.name || "Produto"}"
               loading="lazy"
               onerror="this.src='assets/products/placeholder.jpg'; this.onerror=null;" />
        </div>

        <p class="small">${p.category || ""}</p>
        <h3 class="pTitle">${p.name || ""}</h3>

        <div class="pPriceArea">
          ${offer ? `<div class="pOld">De: ${moneyBRL(p.oldPrice)}</div>` : ``}
          <div class="pNow">${moneyBRL(p.price || 0)}</div>
          ${offer && savings>0 ? `<div class="pSave">Economize ${moneyBRL(savings)}</div>` : ``}
        </div>

        <div class="pMeta">
          <div class="small">${p.id || ""}</div>
        </div>

        <div class="pActions">
          <button class="btn primary"
            data-add-to-cart
            data-id="${p.id}"
            data-name="${p.name}"
            data-price="${p.price}">
            Adicionar
          </button>

          <a class="btn" href="cart.html">Ver carrinho</a>
        </div>
      </article>
    `;
  }).join("");
}

/* =========================
   INIT
   ========================= */
(async function init(){
  CartWhats.updateCartBadge();

  await loadProducts();
  renderOffers();
  renderProducts();

  CartWhats.bindAddToCart({
    onAdded: ({ name }) => showToast(`✅ Adicionado: ${name}`)
  });

  searchInput?.addEventListener("input", () => renderProducts());
  sortSelect?.addEventListener("change", () => renderProducts());

  const whatsFloat = document.getElementById("whatsFloat");
  if (whatsFloat) {
    const text = "Olá! Quero fazer um pedido. Pode me ajudar?";
    whatsFloat.href = `https://wa.me/${STORE_WHATS_E164}?text=${encodeURIComponent(text)}`;
  }
})();