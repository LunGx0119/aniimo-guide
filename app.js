const elementNames = { fire: "火", water: "水", wind: "風", grass: "草", ice: "冰", dark: "暗", electric: "電", rock: "岩", holy: "聖" };
const roleNames = { DPS: "輸出", Support: "支援", Heal: "治療", BREAK: "破防", REGEN: "回能" };
const accentColors = { fire: "#e86d4e", water: "#4fb9c8", wind: "#70b9d1", grass: "#6abf83", ice: "#73b8e6", dark: "#7768c5", electric: "#e4b943", rock: "#ad8a67", holy: "#f0c96a" };
const elementIcons = { fire: "✹", water: "◌", wind: "◒", grass: "❋", ice: "❄", dark: "☾", electric: "⚡", rock: "◈", holy: "✦" };
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function normalizeRecord(record) {
  const elements = Array.isArray(record.elements) ? record.elements : [];
  const roles = Array.isArray(record.roles) ? record.roles : [];
  const stages = Array.isArray(record.stages) ? record.stages : [];
  const forms = Array.isArray(record.forms) ? record.forms : [];
  const skills = Array.isArray(record.skills) ? record.skills : [];
  const firstElement = elements[0] || "unknown";
  return {
    ...record,
    no: String(record.no || "—"),
    name: record.name || "未命名伊莫",
    nameEn: record.nameEn || record.name || "",
    zh: "繁中名稱",
    elements,
    roles,
    element: firstElement,
    elementZh: elements.map(item => elementNames[item] || item).join("／") || "未標示",
    role: roles[0] || "",
    roleZh: roles.map(item => roleNames[item] || item).join("／") || "未標示",
    stage: stages.length ? stages.join(" → ") : "資料待補",
    habitat: Array.isArray(record.habitats) && record.habitats.length ? record.habitats.join(" · ") : "官方未列明",
    mobility: record.mobility || "官方未列明",
    mobilityDescription: record.mobilityDescription || "",
    trait: record.trait || "官方未列明",
    traitDescription: record.traitDescription || "",
    description: record.description || "官方尚未提供簡介。",
    forms,
    stages,
    skills,
    stats: record.stats || {},
    evolutionImages: Array.isArray(record.evolutionImages) ? record.evolutionImages : [],
    accent: accentColors[firstElement] || "#9f9ab8",
    icon: elementIcons[firstElement] || "✦"
  };
}

const creatures = (Array.isArray(window.ANIIMO_RECORDS) ? window.ANIIMO_RECORDS : []).map(normalizeRecord);
let activeElement = "all";
let activeRole = "all";

const grid = document.querySelector("#creature-grid");
const search = document.querySelector("#search");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");
const dialog = document.querySelector("#detail-dialog");
const dialogContent = document.querySelector("#dialog-content");

function cardTemplate(c) {
  return `<article class="creature-card" style="--accent:${esc(c.accent)}" data-id="${esc(c.no)}" tabindex="0" role="button" aria-label="查看 ${esc(c.name)} 詳情">
    <div class="card-top"><span class="dex-no">NO.${esc(c.no)}</span><span class="element-mark" title="${esc(c.elementZh)}元素">${esc(c.elementZh)}</span></div>
    <div class="card-visual"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" onerror="this.classList.add('failed')"><span class="fallback-icon" aria-hidden="true">${esc(c.icon)}</span></div>
    <div class="card-bottom"><h3 class="card-name">${esc(c.name)}<small>${esc(c.roleZh)} · ${esc(c.elementZh)}</small></h3><div class="card-meta"><span class="role-tag">${esc(c.roleZh)}</span><span class="stage">${esc(c.stage.split(" → ")[0])}</span></div></div>
  </article>`;
}

function render() {
  const q = search.value.trim().toLowerCase();
  const visible = creatures.filter(c => {
    const haystack = `${c.name} ${c.nameEn} ${c.description} ${c.trait} ${c.skills.map(skill => `${skill.name} ${skill.nameEn || ""} ${skill.description}`).join(" ")}`.toLowerCase();
    const matchesText = !q || haystack.includes(q);
    const matchesElement = activeElement === "all" || c.elements.includes(activeElement);
    const matchesRole = activeRole === "all" || c.roles.includes(activeRole);
    return matchesText && matchesElement && matchesRole;
  });
  grid.innerHTML = visible.map(cardTemplate).join("");
  count.textContent = `顯示 ${visible.length} / ${creatures.length} 個條目`;
  empty.hidden = visible.length !== 0;
  grid.hidden = visible.length === 0;
  grid.querySelectorAll(".creature-card").forEach(card => {
    card.addEventListener("click", () => openDetail(card.dataset.id));
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(card.dataset.id); } });
  });
}

function statCell(label, value) {
  return `<div class="stat-cell"><span>${esc(label)}</span><strong>${esc(value === undefined ? "—" : value)}</strong></div>`;
}

function skillTemplate(skill, elementZh) {
  return `<article class="skill-row"><div class="skill-icon"><img src="${esc(skill.icon)}" alt="${esc(skill.name)}" loading="lazy" onerror="this.classList.add('failed')"><span>✦</span></div><div class="skill-copy"><div class="skill-title"><strong>${esc(skill.name)}</strong>${skill.meta ? `<small>${esc(elementZh)} · ${esc(skill.meta)}</small>` : ""}</div><p>${esc(skill.description)}</p></div></article>`;
}

function openDetail(id) {
  const c = creatures.find(item => item.no === id);
  if (!c) return;
  const stats = c.stats || {};
  const forms = c.forms.length ? c.forms.map(form => `<span class="form-chip">${esc(form)}</span>`).join("") : `<span class="muted">官方未列明</span>`;
  const evolution = c.evolutionImages.length ? `<div class="evolution-strip">${c.evolutionImages.map((image, index) => `<div class="evolution-item"><img src="${esc(image)}" alt="${esc(c.name)} 進化形態 ${index + 1}" loading="lazy" onerror="this.classList.add('failed')"><span>${esc(c.stages[index] || "分支形態")}</span></div>`).join("")}</div>` : `<p class="muted">官方未列出進化圖。</p>`;
  const habitat = Array.isArray(c.habitats) && c.habitats.length ? c.habitats.map(item => `<span class="habitat-chip">${esc(item)}</span>`).join("") : `<span class="muted">官方未列明</span>`;
  dialogContent.innerHTML = `<div class="detail-inner" style="--accent:${esc(c.accent)}">
    <div class="detail-head"><div class="detail-icon"><img src="${esc(c.image)}" alt="${esc(c.name)}" onerror="this.classList.add('failed')"><span>${esc(c.icon)}</span></div><div><p class="detail-eyebrow">官方伊莫圖鑑 · 編號 ${esc(c.no)}</p><h2>${esc(c.name)}</h2><small>${esc(c.elementZh)} · ${esc(c.roleZh)}</small></div></div>
    <p class="detail-description">${esc(c.description)}</p>
    <div class="detail-facts"><div class="detail-fact"><span>元素</span><strong>${esc(c.elementZh)}</strong></div><div class="detail-fact"><span>定位</span><strong>${esc(c.roleZh)}</strong></div><div class="detail-fact"><span>階段</span><strong>${esc(c.stage)}</strong></div></div>
    <div class="detail-section"><h3>形態與進化</h3><div class="form-list">${forms}</div>${evolution}</div>
    <div class="detail-section"><h3>基礎數值</h3><div class="stats-grid">${statCell("總屬性", stats.attributes)}${statCell("生命", stats.hp)}${statCell("破防", stats.break)}${statCell("攻擊", stats.atk)}${statCell("魔防", stats.mdef)}${statCell("物防", stats.pdef)}${statCell("回能", stats.regen)}</div></div>
    <div class="detail-section"><h3>棲息地</h3><div class="chip-list">${habitat}</div></div>
    <div class="detail-section"><h3>移動能力</h3><p class="detail-lead"><strong>${esc(c.mobility)}</strong>${c.mobilityDescription ? ` · ${esc(c.mobilityDescription)}` : ""}</p></div>
    <div class="detail-section"><h3>特性</h3><div class="trait-box"><strong>${esc(c.trait)}</strong><p>${esc(c.traitDescription || "官方未列明特性說明")}</p></div></div>
    <div class="detail-section skill-section"><div class="section-title-row"><h3>技能介紹</h3><span>${c.skills.length} 個官方技能</span></div><div class="skill-list">${c.skills.map(skill => skillTemplate(skill, c.elementZh)).join("")}</div></div>
    <a class="detail-source" href="https://wiki.aniimo.com/item/${encodeURIComponent(c.id)}" target="_blank" rel="noreferrer">在官方圖鑑查看原頁 ↗</a>
  </div>`;
  dialog.showModal();
}

document.querySelectorAll(".filter-pill").forEach(btn => btn.addEventListener("click", () => {
  const element = btn.dataset.element;
  const role = btn.dataset.role;
  if (element) { activeElement = element; document.querySelectorAll("[data-element]").forEach(b => b.classList.toggle("selected", b.dataset.element === activeElement)); }
  if (role) { activeRole = activeRole === role ? "all" : role; document.querySelectorAll("[data-role]").forEach(b => b.classList.toggle("selected", b.dataset.role === activeRole)); }
  render();
}));

search.addEventListener("input", render);
document.querySelector("#clear-filters").addEventListener("click", () => { activeElement = "all"; activeRole = "all"; search.value = ""; document.querySelectorAll(".filter-pill").forEach(b => b.classList.toggle("selected", b.dataset.element === "all")); render(); });
document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
document.addEventListener("keydown", e => { if (e.key === "/" && document.activeElement !== search) { e.preventDefault(); search.focus(); } });
document.querySelectorAll(".mini-avatar[data-member]").forEach(member => member.addEventListener("click", () => openDetail(member.dataset.member)));
const backToTop = document.querySelector("#back-to-top");
function updateBackToTop() { backToTop.classList.toggle("visible", window.scrollY > 420); }
window.addEventListener("scroll", updateBackToTop, { passive: true });
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
updateBackToTop();
render();
