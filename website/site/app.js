import { navigationGroups, release, sections } from "./reference-data.js";
import { generatedPages } from "./generated-reference-data.js";

const root = document.querySelector("#reference-root");
const navigation = document.querySelector("#navigation-menu");
const search = document.querySelector("#search");
const emptyState = document.querySelector("#empty-state");
const clearSearch = document.querySelector("#clear-search");
const themeButton = document.querySelector("#theme-button");
const menuButton = document.querySelector("#menu-button");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#scrim");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function codeBlock(code, label = "Luau") {
  return `<div class="code-block">
    <div class="code-toolbar">
      <span class="code-language">${escapeHtml(label)}</span>
      <button class="copy-button" type="button" aria-label="Copy code" title="Copy code">
        <svg class="copy-icon" aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
        <svg class="check-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>
      </button>
    </div>
    <pre data-language="${escapeHtml(label)}"><code>${escapeHtml(code)}</code></pre>
  </div>`;
}

function table(title, rows, id) {
  return `<article class="reference-card wide searchable"${id ? ` id="${escapeHtml(id)}"` : ""}>
    <h3>${escapeHtml(title)}</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Values / type</th><th>Description</th></tr></thead>
      <tbody>${rows.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.values)}</td><td>${escapeHtml(item.description)}</td></tr>`).join("")}</tbody>
    </table></div>
  </article>`;
}

const propertyLinks = Object.freeze({
  layout: ["Layout", "#ui-properties-layout", "Spacing, size, alignment, and responsiveness"],
  semantic: ["Semantics and accessibility", "#ui-properties-semantics", "Roles, labels, and assistive-technology states"],
  surface: ["Surface", "#ui-properties-layout", "Container background, border, and elevation"],
  motion: ["Motion", "#ui-properties-events", "MotionMap and supported animation channels"],
  columns: ["Columns", "#ui-properties-layout", "UI.Grid column modes"],
  scroll: ["Scrolling", "#ui-properties-layout", "Vertical or horizontal axis"],
  label: ["Accessible name", "#ui-properties-semantics", "A label for the user and screen reader"],
  visual: ["Images and shapes", "#ui-properties-visual", "Size, fill, stroke, fit, and geometry"],
  text: ["Text and state", "#ui-properties-text-style", "Alignment, local colors, and text background"],
  "text-style": ["Text styling", "#ui-properties-text-style", "Alignment, local colors, and text background"],
  theme: ["Screen theme", "#ui-properties-theme", "Global colors and color-token overrides"],
  action: ["Button action", "#ui-properties-events", "onTap, appearance, and button states"],
  input: ["Text input", "#ui-properties-input", "Value, keyboard, IME, and validation hints"],
  modal: ["Modal", "#ui-properties-events", "Opening, closing, and focus return"],
});

function renderProps(props) {
  if (!props) return "";
  const keys = Array.isArray(props) ? props : String(props).split(/\s*(?:,|\+)\s*/);
  const links = keys.map((key) => {
    const definition = propertyLinks[key];
    if (!definition) return `<code>${escapeHtml(key)}</code>`;
    const [label, href, title] = definition;
    return `<a class="property-link" href="${escapeHtml(href)}" title="${escapeHtml(title)}"><code>${escapeHtml(label)}</code></a>`;
  });
  return `<p class="property-links"><strong>Primary parameters:</strong> ${links.join(" ")}</p>`;
}

function card(item) {
  const parameters = item.parameters?.length ? `<div class="table-wrap"><table>
    <thead><tr><th>Parameter</th><th>Type / values</th><th>Description</th></tr></thead>
    <tbody>${item.parameters.map((parameter) => `<tr><td>${escapeHtml(parameter.name)}</td><td>${escapeHtml(parameter.values)}</td><td>${escapeHtml(parameter.description)}</td></tr>`).join("")}</tbody>
  </table></div>` : "";
  const props = item.parameters?.length ? "" : renderProps(item.props);
  const returns = item.returns ? `<p><strong>Returns:</strong> ${escapeHtml(item.returns)}</p>` : "";
  const useWhen = item.useWhen ? `<p class="use-when"><strong>When to use:</strong> ${escapeHtml(item.useWhen)}</p>` : "";
  const points = item.points?.length ? `<ul class="compact-list">${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : "";
  return `<article class="reference-card searchable${item.wide ? " wide" : ""}">
    <h3>${escapeHtml(item.name)}</h3>
    <p class="signature"><code>${escapeHtml(item.signature)}</code></p>
    <p>${escapeHtml(item.description)}</p>
    ${useWhen}${props}${returns}${points}${parameters}${item.code ? codeBlock(item.code, item.language ?? "Luau") : ""}
  </article>`;
}

function renderSection(section) {
  if (section.hero) {
    return `<section class="hero api-section searchable" id="${escapeHtml(section.id)}">
      <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
      <h1>${escapeHtml(section.title)}</h1>
      <p class="lead">${escapeHtml(section.summary)}</p>
      <div class="hero-badges">${section.badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>
      ${section.notes.map((note) => `<div class="callout"><p>${escapeHtml(note)}</p></div>`).join("")}
    </section>`;
  }
  const detailedCards = generatedPages.filter((page) => page.sectionId === section.id && page.kind !== "parameter-group");
  const body = [
    section.guide?.length ? `<div class="section-guide searchable">${section.guide.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>` : "",
    section.callout ? `<div class="callout searchable"><p><strong>Note.</strong> ${escapeHtml(section.callout)}</p></div>` : "",
    detailedCards.length ? `<div class="card-grid">${detailedCards.map(card).join("")}</div>` : "",
    section.tables?.length ? `<div class="card-grid">${section.tables.map((item) => table(item.title, item.rows, item.id)).join("")}</div>` : "",
    section.example ? `<article class="reference-card wide searchable"><h3>Example</h3>${codeBlock(section.example, section.exampleLanguage ?? "Luau")}</article>` : "",
  ].join("");
  return `<section class="api-section" id="${escapeHtml(section.id)}">
    <header class="section-heading searchable">
      <div><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.summary)}</p></div>
      ${section.module ? `<span class="module-name">${escapeHtml(section.module)}</span>` : ""}
    </header>
    ${body}
  </section>`;
}

function renderNavigation() {
  navigation.innerHTML = navigationGroups.map((group) => `<div class="nav-group">
    <span class="nav-label">${escapeHtml(group.label)}</span>
    ${group.items.map(([id, label]) => `<a class="nav-link" href="#${escapeHtml(id)}" data-section="${escapeHtml(id)}"><span>${escapeHtml(label)}</span></a>`).join("")}
  </div>`).join("");
}

function renderReference() {
  root.innerHTML = `${sections.map(renderSection).join("")}
    <footer class="footer">
      <p><strong>Luastra SDK ${escapeHtml(release.version)}</strong> · ${escapeHtml(release.status)} · snapshot ${escapeHtml(release.date)}</p>
      <p>Canonical documentation for the Luastra ${escapeHtml(release.version)} source alpha.</p>
    </footer>`;
}

function closeMenu() {
  sidebar.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  scrim.hidden = true;
}

function toggleMenu() {
  const open = !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  scrim.hidden = !open;
}

function normalize(value) {
  return value.toLocaleLowerCase("en").trim();
}

function applySearch() {
  const query = normalize(search.value);
  let visibleItems = 0;
  for (const section of document.querySelectorAll(".api-section")) {
    if (!query || section.classList.contains("hero")) {
      section.classList.remove("hidden-by-search");
      for (const item of section.querySelectorAll(".searchable")) item.classList.remove("hidden-by-search");
      if (!section.classList.contains("hero")) visibleItems += section.querySelectorAll(".reference-card").length || 1;
      continue;
    }
    const heading = normalize(section.querySelector(".section-heading")?.textContent ?? "");
    const sectionMatch = heading.includes(query);
    let matches = 0;
    for (const item of section.querySelectorAll(".reference-card, .callout")) {
      const match = sectionMatch || normalize(item.textContent).includes(query);
      item.classList.toggle("hidden-by-search", !match);
      if (match) matches += 1;
    }
    section.classList.toggle("hidden-by-search", matches === 0);
    if (matches > 0) {
      section.querySelector(".section-heading")?.classList.remove("hidden-by-search");
      visibleItems += matches;
    }
  }
  emptyState.hidden = query === "" || visibleItems > 0;
}

async function copyCode(button) {
  const block = button.closest(".code-block");
  const value = block?.querySelector("code")?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.classList.add("copied");
  button.setAttribute("aria-label", "Code copied");
  button.setAttribute("title", "Code copied");
  window.setTimeout(() => {
    button.classList.remove("copied");
    button.setAttribute("aria-label", "Copy code");
    button.setAttribute("title", "Copy code");
  }, 1200);
}

function setTheme(theme) {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  themeButton.setAttribute("aria-label", theme === "dark" ? "Use light theme" : "Use dark theme");
  localStorage.setItem("luastra-docs-theme", theme);
}

function initializeTheme() {
  const stored = localStorage.getItem("luastra-docs-theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(stored === "dark" || stored === "light" ? stored : preferred);
}

renderNavigation();
renderReference();
initializeTheme();
document.querySelector("#version-badge").textContent = release.version.replace("0.1.0-", "");

search.addEventListener("input", applySearch);
clearSearch.addEventListener("click", () => { search.value = ""; applySearch(); search.focus(); });
themeButton.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
menuButton.addEventListener("click", toggleMenu);
scrim.addEventListener("click", closeMenu);
navigation.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
root.addEventListener("click", (event) => {
  const button = event.target.closest(".copy-button");
  if (button) copyCode(button);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  } else if (event.key === "Escape") {
    if (sidebar.classList.contains("open")) closeMenu();
    else if (search.value) { search.value = ""; applySearch(); search.focus(); }
  }
});

const links = new Map([...document.querySelectorAll(".nav-link")].map((link) => [link.dataset.section, link]));
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
  if (!visible) return;
  for (const link of links.values()) link.removeAttribute("aria-current");
  links.get(visible.target.id)?.setAttribute("aria-current", "true");
}, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
for (const section of document.querySelectorAll(".api-section")) observer.observe(section);
