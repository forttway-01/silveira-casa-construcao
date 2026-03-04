/* =========================
   ADMIN.JS — Catálogo local
   Salva em localStorage e exporta products.json
   ========================= */

const STORAGE_KEY = "catalog_admin_v1";

const els = {
  form: document.getElementById("productForm"),
  editIndex: document.getElementById("editIndex"),
  id: document.getElementById("id"),
  name: document.getElementById("name"),
  price: document.getElementById("price"),
  category: document.getElementById("category"),
  image: document.getElementById("image"),
  imageUrl: document.getElementById("imageUrl"),
  previewImg: document.getElementById("previewImg"),
  previewHint: document.getElementById("previewHint"),
  list: document.getElementById("list"),
  search: document.getElementById("search"),
  catFilter: document.getElementById("catFilter"),
  toast: document.getElementById("toast"),

  formTitle: document.getElementById("formTitle"),
  btnSave: document.getElementById("btnSave"),
  btnReset: document.getElementById("btnReset"),
  btnDelete: document.getElementById("btnDelete"),

  btnExport: document.getElementById("btnExport"),
  btnImport: document.getElementById("btnImport"),
  fileInput: document.getElementById("fileInput"),

  btnSeed: document.getElementById("btnSeed"),
  btnClearAll: document.getElementById("btnClearAll"),
  countPill: document.getElementById("countPill"),
};

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1600);
}

function loadCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCatalog(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function moneyBRL(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeId(id) {
  return String(id || "").trim().toUpperCase();
}

function buildImagePath(fileName) {
  const f = String(fileName || "").trim();
  if (!f) return "";
  if (f.startsWith("http://") || f.startsWith("https://")) return f;
  if (f.startsWith("assets/")) return f;
  return `assets/products/${f}`;
}

function setPreview() {
  const direct = String(els.imageUrl.value || "").trim();
  const file = String(els.image.value || "").trim();
  const src = direct || buildImagePath(file);

  if (!src) {
    els.previewImg.style.display = "none";
    els.previewHint.style.display = "block";
    els.previewHint.textContent = "Sem imagem";
    return;
  }

  els.previewImg.src = src;
  els.previewImg.style.display = "block";
  els.previewHint.style.display = "none";
}

function getFormData() {
  return {
    id: normalizeId(els.id.value),
    name: String(els.name.value || "").trim(),
    price: Number(els.price.value || 0),
    category: String(els.category.value || "").trim(),
    image: buildImagePath(els.image.value),
  };
}

function validateProduct(p, catalog, editingIndex) {
  if (!p.id) return "SKU/ID é obrigatório.";
  if (!p.name) return "Nome é obrigatório.";
  if (!Number.isFinite(p.price) || p.price < 0) return "Preço inválido.";
  if (!p.category) return "Categoria é obrigatória.";

  const duplicated = catalog.findIndex((x, idx) => x.id === p.id && idx !== editingIndex);
  if (duplicated >= 0) return `SKU/ID já existe: ${p.id}`;

  return null;
}

function resetForm() {
  els.editIndex.value = "";
  els.formTitle.textContent = "Novo produto";
  els.btnDelete.disabled = true;

  els.id.value = "";
  els.name.value = "";
  els.price.value = "";
  els.category.value = "";
  els.image.value = "";
  els.imageUrl.value = "";

  setPreview();
}

function fillForm(p, index) {
  els.editIndex.value = String(index);
  els.formTitle.textContent = `Editando: ${p.id}`;
  els.btnDelete.disabled = false;

  els.id.value = p.id || "";
  els.name.value = p.name || "";
  els.price.value = String(p.price ?? "");
  els.category.value = p.category || "";

  // Se a imagem estiver no padrão assets/products/arquivo.jpg, mostramos só o arquivo pra facilitar
  if (p.image && p.image.startsWith("assets/products/")) {
    els.image.value = p.image.replace("assets/products/", "");
  } else if (p.image) {
    els.image.value = p.image;
  } else {
    els.image.value = "";
  }

  els.imageUrl.value = ""; // preview opcional por URL
  setPreview();
}

function uniqueCategories(catalog) {
  const set = new Set(catalog.map(p => p.category).filter(Boolean));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function renderCategoryFilter(catalog) {
  const current = els.catFilter.value || "__ALL__";
  const cats = uniqueCategories(catalog);

  els.catFilter.innerHTML = `
    <option value="__ALL__">Todas categorias</option>
    ${cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
  `;

  // mantém seleção se possível
  const exists = cats.includes(current);
  els.catFilter.value = exists ? current : "__ALL__";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function matchesFilters(p) {
  const q = String(els.search.value || "").trim().toLowerCase();
  const cat = els.catFilter.value;

  const qOk = !q || (p.name||"").toLowerCase().includes(q) || (p.id||"").toLowerCase().includes(q);
  const catOk = (cat === "__ALL__") || p.category === cat;

  return qOk && catOk;
}

function renderList() {
  const catalog = loadCatalog();
  renderCategoryFilter(catalog);

  const filtered = catalog.filter(matchesFilters);

  els.countPill.textContent = `${catalog.length} itens`;

  if (!filtered.length) {
    els.list.innerHTML = `
      <div class="item" style="cursor:default;">
        <div class="itemMain">
          <div class="itemTitle">Nenhum produto encontrado</div>
          <div class="itemMeta">
            <span class="tag">Dica</span>
            <span>Cadastre um produto no formulário ao lado.</span>
          </div>
        </div>
      </div>
    `;
    return;
  }

  els.list.innerHTML = filtered.map((p) => {
    const price = moneyBRL(p.price || 0);
    const img = p.image ? `<span class="tag">📷</span>` : "";
    return `
      <div class="item" data-pick="${escapeHtml(p.id)}">
        <div class="itemMain">
          <div class="itemTitle">${escapeHtml(p.name || "")}</div>
          <div class="itemMeta">
            <span class="tag">${escapeHtml(p.id)}</span>
            <span class="tag">${escapeHtml(p.category || "")}</span>
            <span class="tag">${price}</span>
            ${img}
          </div>
        </div>
        <div class="itemMeta" style="justify-content:flex-end;">
          <span class="tag">Editar</span>
        </div>
      </div>
    `;
  }).join("");
}

function exportJSON() {
  const catalog = loadCatalog();

  // Ordena por categoria e nome (fica bonito)
  const out = [...catalog].sort((a,b) => {
    const c = (a.category||"").localeCompare(b.category||"");
    if (c !== 0) return c;
    return (a.name||"").localeCompare(b.name||"");
  });

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "products.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  toast("✅ products.json exportado!");
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("JSON deve ser uma lista (array).");

      // Normaliza
      const normalized = data.map((p) => ({
        id: normalizeId(p.id),
        name: String(p.name || "").trim(),
        price: Number(p.price || 0),
        category: String(p.category || "").trim(),
        image: buildImagePath(p.image || ""),
      }));

      // Filtra inválidos (pra não quebrar o site)
      const safe = normalized.filter(p => p.id && p.name && Number.isFinite(p.price) && p.category);

      saveCatalog(safe);
      resetForm();
      renderList();
      toast("✅ Catálogo importado!");
    } catch (e) {
      console.error(e);
      alert("Erro ao importar JSON. Verifique o arquivo.");
    }
  };
  reader.readAsText(file);
}

/* =========================
   EVENTS
   ========================= */

els.image.addEventListener("input", setPreview);
els.imageUrl.addEventListener("input", setPreview);

els.btnReset.addEventListener("click", resetForm);

els.btnExport.addEventListener("click", exportJSON);

els.btnImport.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", (ev) => {
  const file = ev.target.files?.[0];
  if (file) importJSONFile(file);
  ev.target.value = "";
});

els.search.addEventListener("input", renderList);
els.catFilter.addEventListener("change", renderList);

els.list.addEventListener("click", (ev) => {
  const row = ev.target.closest("[data-pick]");
  if (!row) return;

  const id = row.getAttribute("data-pick");
  const catalog = loadCatalog();
  const index = catalog.findIndex(p => p.id === id);
  if (index < 0) return;

  fillForm(catalog[index], index);
  toast("✏️ Editando produto");
});

els.form.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const catalog = loadCatalog();
  const idxStr = els.editIndex.value;
  const editingIndex = idxStr === "" ? -1 : Number(idxStr);

  const product = getFormData();
  const error = validateProduct(product, catalog, editingIndex);
  if (error) {
    alert(error);
    return;
  }

  if (editingIndex >= 0) {
    catalog[editingIndex] = product;
    toast("✅ Produto atualizado!");
  } else {
    catalog.push(product);
    toast("✅ Produto cadastrado!");
  }

  saveCatalog(catalog);
  resetForm();
  renderList();
});

els.btnDelete.addEventListener("click", () => {
  const idxStr = els.editIndex.value;
  if (idxStr === "") return;

  if (!confirm("Excluir este produto?")) return;

  const idx = Number(idxStr);
  const catalog = loadCatalog();
  catalog.splice(idx, 1);
  saveCatalog(catalog);

  resetForm();
  renderList();
  toast("🗑️ Produto excluído!");
});

els.btnClearAll.addEventListener("click", () => {
  if (!confirm("Limpar TODO o catálogo salvo no navegador?")) return;
  saveCatalog([]);
  resetForm();
  renderList();
  toast("🧹 Catálogo limpo!");
});

els.btnSeed.addEventListener("click", () => {
  const catalog = loadCatalog();
  const seed = [
    { id:"SKU001", name:"Cimento CP II 50kg", price: 32.90, category:"Materiais Básicos", image:"assets/products/cimento-cp2-50kg.jpg" },
    { id:"SKU002", name:"Tinta Acrílica 18L", price: 289.90, category:"Acabamento", image:"assets/products/tinta-acrilica-18l.jpg" },
    { id:"SKU003", name:"Fita Isolante 20m", price: 7.90, category:"Elétrica", image:"assets/products/fita-isolante-20m.jpg" }
  ];

  // só adiciona os que não existirem
  const map = new Map(catalog.map(p => [p.id, p]));
  seed.forEach(s => { if (!map.has(s.id)) catalog.push(s); });

  saveCatalog(catalog);
  renderList();
  toast("✅ Exemplos adicionados!");
});

/* =========================
   INIT
   ========================= */
(function init(){
  setPreview();
  renderList();
})();