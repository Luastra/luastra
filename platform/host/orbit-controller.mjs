const directionVectors = Object.freeze({
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
});
const orbitThemeIds = Object.freeze(["luastra", "abyss", "sakura", "atlas", "arctic", "biolume", "arcade", "bauhaus", "editorial", "copper", "candy"]);
const orbitThemeSet = new Set(orbitThemeIds);
const orbitStatusSymbols = Object.freeze({ neutral: "•", active: "◆", success: "✓", warning: "!", error: "×" });
const orbitSignalIconPaths = Object.freeze({
  bolt: ["M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"],
  book: ["M4 4.5A2.5 2.5 0 0 1 6.5 2H11v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Zm16 0A2.5 2.5 0 0 0 17.5 2H13v17h4.5a2.5 2.5 0 0 1 2.5 2.5v-17Z"],
  check: ["m5 12 4 4L19 6"],
  compass: ["m15.5 8.5-2 5-5 2 2-5 5-2Z", "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"],
  gauge: ["M4.2 17a8 8 0 1 1 15.6 0", "m12 14 4-5", "M7 17h10"],
  grid: ["M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"],
  play: ["m8 5 11 7-11 7V5Z"],
  rocket: ["M14 4c2.5-2 5-2 6-2 0 1 0 3.5-2 6L14 10l-4 4-3.5-1.5L2 17l5 1 1 4 4.5-4.5L14 10", "M5 19 2 22"],
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z", "m16 16 5 5"],
  settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"],
  spark: ["m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z", "m19 17 .6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z"],
  star: ["m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1L12 2Z"],
});

function fail(message) { throw new Error(message); }
function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  return Number.isInteger(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}
function classValue(element, prefix, fallback) {
  const token = [...element.classList].find((name) => name.startsWith(prefix));
  return token ? token.slice(prefix.length) : fallback;
}

export function decodeOrbitPreferences(value) {
  if (typeof value !== "string" || value.length > 64) return null;
  const match = /^v1:([a-z]+):(system|off)$/.exec(value);
  if (!match || !orbitThemeSet.has(match[1])) return null;
  return Object.freeze({ theme: match[1], motion: match[2] });
}

export function focusTransitionGeometry(source, target) {
  if (![source, target].every((rect) => rect && [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)) ||
      source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) return null;
  const clampScale = (value) => Math.min(1.5, Math.max(0.05, value));
  return Object.freeze({
    translateX: source.left + source.width / 2 - (target.left + target.width / 2),
    translateY: source.top + source.height / 2 - (target.top + target.height / 2),
    scaleX: clampScale(source.width / target.width),
    scaleY: clampScale(source.height / target.height),
  });
}

export function parseOrbitDuration(value, fallback) {
  if (typeof value !== "string") return fallback;
  const match = /^\s*([0-9]+(?:\.[0-9]+)?)(ms|s)\s*$/.exec(value);
  if (!match) return fallback;
  const milliseconds = Number(match[1]) * (match[2] === "s" ? 1000 : 1);
  return Number.isFinite(milliseconds) ? Math.min(2000, Math.max(0, milliseconds)) : fallback;
}

export function manageOrbitAnimation(animation, onSettle) {
  if (!animation || typeof animation.cancel !== "function" || typeof animation.finished?.then !== "function" || typeof onSettle !== "function") {
    fail("Orbit animation requires a cancelable animation, a finished promise and a settle callback");
  }
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    onSettle();
  };
  animation.finished.then(settle, settle);
  return Object.freeze({
    cancel() {
      if (settled) return;
      try { animation.cancel(); }
      catch {}
      settle();
    },
    get settled() { return settled; },
  });
}

export function nearestDirectionalNode(nodes, currentIndex, key) {
  const direction = directionVectors[key];
  if (!direction || !Array.isArray(nodes) || !nodes[currentIndex]) return currentIndex;
  const current = nodes[currentIndex];
  let best = currentIndex;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 0; index < nodes.length; index += 1) {
    if (index === currentIndex) continue;
    const dx = nodes[index].x - current.x;
    const dy = nodes[index].y - current.y;
    const projection = dx * direction[0] + dy * direction[1];
    if (projection <= 0) continue;
    const cross = Math.abs(dx * direction[1] - dy * direction[0]);
    const score = projection + cross * 2.25;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  }
  return best;
}

function listLayout(nodes) {
  return Object.freeze({
    mode: "list",
    points: Object.freeze(nodes.map((node, index) => Object.freeze({ id: node.id, x: 0, y: index, ring: 0, detail: "preview" }))),
  });
}

function unconditionallyUsesList(width, height, nodeCount, presentation, maxVisible) {
  const constrained = width < 560 || height < 520;
  const estimatedCapacity = Math.max(4, Math.floor(((width * height) - 32000) / 39000));
  return presentation === "list" || constrained || nodeCount > maxVisible || nodeCount > estimatedCapacity;
}

export function resolveOrbitRelationships(nodes) {
  if (!Array.isArray(nodes)) fail("Orbit relationships require a node array");
  const nodeById = new Map(nodes.filter((node) => typeof node?.id === "string").map((node) => [node.id, node]));
  const edges = [];
  const seen = new Set();
  for (const node of nodes) {
    if (typeof node?.id !== "string") continue;
    const targets = Array.isArray(node.relatedTo) ? node.relatedTo : [];
    for (const target of targets) {
      if (typeof target !== "string" || target === node.id || !nodeById.has(target)) continue;
      const endpoints = [node.id, target].sort();
      const key = `${endpoints[0]}\u0000${endpoints[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(Object.freeze({ source: endpoints[0], target: endpoints[1] }));
    }
  }
  return Object.freeze(edges);
}

export function resolveOrbitSemanticOrder(nodes) {
  if (!Array.isArray(nodes)) fail("Orbit semantic ordering requires a node array");
  const indexById = new Map(nodes.map((node, index) => [node?.id, index]));
  const adjacency = new Map(nodes.map((node) => [node?.id, new Set()]));
  for (const edge of resolveOrbitRelationships(nodes)) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }
  const capacity = nodes.length <= 8 ? [nodes.length, 0, 0]
    : nodes.length <= 14 ? [6, nodes.length - 6, 0]
      : [6, 10, nodes.length - 16];
  const groups = [[], [], []];
  const automatic = [];
  for (const node of nodes) {
    const explicitRing = Number(node?.ring);
    if (Number.isInteger(explicitRing) && explicitRing >= 1 && explicitRing <= 3) groups[explicitRing - 1].push(node);
    else automatic.push(node);
  }
  const importance = (left, right) => {
    const priority = boundedInteger(left?.priority, 2, 1, 3) - boundedInteger(right?.priority, 2, 1, 3);
    if (priority !== 0) return priority;
    const degree = (adjacency.get(right?.id)?.size ?? 0) - (adjacency.get(left?.id)?.size ?? 0);
    if (degree !== 0) return degree;
    return (indexById.get(left?.id) ?? 0) - (indexById.get(right?.id) ?? 0);
  };
  automatic.sort(importance);
  for (const node of automatic) {
    let ringIndex = groups.findIndex((group, index) => group.length < capacity[index]);
    if (ringIndex < 0) ringIndex = groups.reduce((best, group, index) => group.length < groups[best].length ? index : best, 0);
    groups[ringIndex].push(node);
  }
  const orderedGroups = groups.map((group) => {
    const remaining = [...group].sort((left, right) => (indexById.get(left?.id) ?? 0) - (indexById.get(right?.id) ?? 0));
    const ordered = [];
    while (remaining.length > 0) {
      if (ordered.length === 0) {
        ordered.push(remaining.shift());
        continue;
      }
      const previous = ordered[ordered.length - 1];
      remaining.sort((left, right) => {
        const relationRank = (candidate) => adjacency.get(previous?.id)?.has(candidate?.id) ? 0
          : ordered.some((placed) => adjacency.get(placed?.id)?.has(candidate?.id)) ? 1 : 2;
        const related = relationRank(left) - relationRank(right);
        return related !== 0 ? related : importance(left, right);
      });
      ordered.push(remaining.shift());
    }
    return ordered;
  });
  return Object.freeze(orderedGroups.flatMap((group, ringIndex) => group.map((node, slot) => Object.freeze({
    id: node.id,
    ring: ringIndex + 1,
    slot,
  }))));
}

export function resolveOrbitSemanticDetail({ width, height, mode, nodes, placements }) {
  if (!Array.isArray(nodes) || !Array.isArray(placements)) fail("Orbit semantic detail requires node and placement arrays");
  const placementById = new Map(placements.map((placement) => [placement?.id, placement]));
  const safeWidth = Math.max(0, finite(width, 0));
  const safeHeight = Math.max(0, finite(height, 0));
  if (mode === "list") return Object.freeze(nodes.map((node) => Object.freeze({ id: node.id, detail: "preview" })));
  const perNodeArea = safeWidth * safeHeight / Math.max(1, nodes.length);
  const sparse = nodes.length <= 2 && safeWidth >= 560 && safeHeight >= 520;
  const generous = sparse || (nodes.length <= 6 && safeWidth >= 960 && safeHeight >= 540 && perNodeArea >= 100000);
  const pressured = nodes.length > 8 || safeWidth < 840 || safeHeight < 535 || perNodeArea < 72000;
  return Object.freeze(nodes.map((node) => {
    const priority = boundedInteger(node?.priority, 2, 1, 3);
    const ring = boundedInteger(placementById.get(node?.id)?.ring, 3, 1, 3);
    let detail = "preview";
    if (!generous) {
      if (pressured) {
        if (priority === 1 && ring === 1) detail = "preview";
        else if (priority <= 2 && ring <= 2) detail = "identity";
        else detail = node?.signalIcon in orbitSignalIconPaths ? "signal" : "identity";
      } else if (priority === 2) detail = "identity";
      else if (priority === 3) detail = node?.signalIcon in orbitSignalIconPaths ? "signal" : "identity";
    }
    return Object.freeze({ id: node.id, detail });
  }));
}

function syncOrbitSemanticDetail(elements, pointById, layoutMode) {
  for (const element of elements) {
    const point = pointById?.get(element.dataset.luastraId);
    const detail = point?.detail === "signal" || point?.detail === "identity" ? point.detail : "preview";
    if (layoutMode === "list") {
      if (element.dataset.luastraOrbitDetail !== undefined) delete element.dataset.luastraOrbitDetail;
    }
    else element.dataset.luastraOrbitDetail = detail;
    const iconName = element.dataset.luastraOrbitSignalIcon ?? "";
    const hasSignalIcon = iconName in orbitSignalIconPaths;
    const statusTone = element.className.includes("luastra-orbit-status-") ? classValue(element, "luastra-orbit-status-", "") : "";
    const hasStatusTone = statusTone in orbitStatusSymbols;
    const busy = element.getAttribute("aria-busy") === "true";
    if (!hasSignalIcon && !hasStatusTone && !busy && element.dataset.luastraOrbitDecorated !== "true") continue;
    let signal = element.querySelector(":scope > .luastra-orbit-signal-icon");
    if (!hasSignalIcon) signal?.remove();
    else if (!signal || signal.dataset.icon !== iconName) {
      signal?.remove();
      signal = element.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
      signal.classList.add("luastra-orbit-signal-icon");
      signal.dataset.icon = iconName;
      signal.setAttribute("viewBox", "0 0 24 24");
      signal.setAttribute("aria-hidden", "true");
      for (const pathData of orbitSignalIconPaths[iconName]) {
        const path = element.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        signal.append(path);
      }
      element.append(signal);
    }
    let reveal = element.querySelector(":scope > .luastra-orbit-signal-reveal");
    const title = hasSignalIcon ? element.querySelector(":scope > .luastra-text:first-child")?.textContent?.trim() ?? "" : "";
    const status = hasSignalIcon ? element.querySelector(":scope > .luastra-orbit-node-status")?.textContent?.trim() ?? "" : "";
    if (hasSignalIcon && title.length > 0) {
      if (!reveal) {
        reveal = element.ownerDocument.createElement("span");
        reveal.className = "luastra-orbit-signal-reveal";
        reveal.setAttribute("aria-hidden", "true");
        element.append(reveal);
      }
      reveal.textContent = status.length > 0 ? `${title} · ${status}` : title;
    } else reveal?.remove();
    let statusIndicator = element.querySelector(":scope > .luastra-orbit-status-indicator");
    if (!hasStatusTone) {
      delete element.dataset.luastraOrbitStatusTone;
      statusIndicator?.remove();
    } else {
      element.dataset.luastraOrbitStatusTone = statusTone;
      if (!statusIndicator) {
        statusIndicator = element.ownerDocument.createElement("span");
        statusIndicator.className = "luastra-orbit-status-indicator";
        statusIndicator.setAttribute("aria-hidden", "true");
        element.append(statusIndicator);
      }
      statusIndicator.textContent = orbitStatusSymbols[statusTone];
    }
    let busyIndicator = element.querySelector(":scope > .luastra-orbit-busy-indicator");
    if (busy) {
      if (!busyIndicator) {
        busyIndicator = element.ownerDocument.createElement("span");
        busyIndicator.className = "luastra-orbit-busy-indicator";
        busyIndicator.setAttribute("aria-hidden", "true");
        element.append(busyIndicator);
      }
    } else busyIndicator?.remove();
    if (hasSignalIcon || hasStatusTone || busy) element.dataset.luastraOrbitDecorated = "true";
    else delete element.dataset.luastraOrbitDecorated;
  }
}

function syncOrbitRelationships(constellation, elements, layout, pointById) {
  let layer = constellation.querySelector(":scope > .luastra-orbit-connections");
  if (!elements.some((element) => (element.dataset.luastraOrbitRelatedTo ?? "").length > 0)) {
    if (layer) {
      layer.replaceChildren();
      layer.hidden = true;
    }
    for (const element of elements) {
      const descriptionId = `${element.id}--orbit-relations`;
      if (element.getAttribute("aria-describedby") !== descriptionId) continue;
      element.querySelector(":scope > .luastra-orbit-relation-description")?.remove();
      element.removeAttribute("aria-describedby");
    }
    return;
  }
  const nodes = elements.map((element) => ({
    id: element.dataset.luastraId,
    relatedTo: (element.dataset.luastraOrbitRelatedTo ?? "").split(",").filter(Boolean),
  }));
  const edges = resolveOrbitRelationships(nodes);
  if (edges.length === 0) {
    if (layer) {
      layer.replaceChildren();
      layer.hidden = true;
    }
    for (const element of elements) {
      const descriptionId = `${element.id}--orbit-relations`;
      if (element.getAttribute("aria-describedby") !== descriptionId) continue;
      element.querySelector(":scope > .luastra-orbit-relation-description")?.remove();
      element.removeAttribute("aria-describedby");
    }
    return;
  }
  if (!layer) {
    layer = constellation.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    layer.classList.add("luastra-orbit-connections");
    layer.setAttribute("aria-hidden", "true");
    constellation.append(layer);
  }
  layer.replaceChildren();
  layer.toggleAttribute("hidden", layout.mode !== "spatial");
  if (layout.mode === "spatial") {
    for (const edge of edges) {
      const source = pointById.get(edge.source);
      const target = pointById.get(edge.target);
      if (!source || !target) continue;
      const line = constellation.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(source.x));
      line.setAttribute("y1", String(source.y));
      line.setAttribute("x2", String(target.x));
      line.setAttribute("y2", String(target.y));
      layer.append(line);
    }
  }
  const relatedLabels = new Map(elements.map((element) => [
    element.dataset.luastraId,
    element.querySelector(":scope > .luastra-text")?.textContent?.trim() ?? element.dataset.luastraId,
  ]));
  const targetsByNode = new Map(elements.map((element) => [element.dataset.luastraId, []]));
  for (const edge of edges) {
    targetsByNode.get(edge.source)?.push(relatedLabels.get(edge.target));
    targetsByNode.get(edge.target)?.push(relatedLabels.get(edge.source));
  }
  for (const element of elements) {
    const id = element.dataset.luastraId;
    const descriptionId = `${element.id}--orbit-relations`;
    let description = element.querySelector(":scope > .luastra-orbit-relation-description");
    const labels = targetsByNode.get(id)?.filter(Boolean) ?? [];
    if (labels.length === 0) {
      description?.remove();
      if (element.getAttribute("aria-describedby") === descriptionId) element.removeAttribute("aria-describedby");
      continue;
    }
    if (!description) {
      description = constellation.ownerDocument.createElement("span");
      description.className = "luastra-orbit-relation-description";
      description.id = descriptionId;
      element.append(description);
    }
    description.textContent = `Related to ${labels.join(", ")}.`;
    element.setAttribute("aria-describedby", descriptionId);
  }
}

function orbitNodeSize(node, width, detail = "preview") {
  const defaultWidth = Math.min(176, Math.max(136, width * 0.18));
  const defaultHeight = detail === "preview" && node.hasStatus ? 112 : detail === "preview" ? 92 : 68;
  return Object.freeze({
    width: Math.min(384, Math.max(44, finite(node.width, defaultWidth))),
    height: Math.min(240, Math.max(44, finite(node.height, defaultHeight))),
  });
}

function overlapping(left, right, gap) {
  return left.left < right.right + gap && left.right + gap > right.left &&
    left.top < right.bottom + gap && left.bottom + gap > right.top;
}

function spatialLayoutIsSafe(width, height, nodes, points) {
  const edge = 8;
  const gap = 8;
  const centerWidth = Math.min(240, width * 0.42);
  const center = {
    left: (width - centerWidth) / 2,
    right: (width + centerWidth) / 2,
    top: (height - 144) / 2,
    bottom: (height + 144) / 2,
  };
  const rectangles = points.map((point, index) => {
    const size = orbitNodeSize(nodes[index], width, point.detail);
    return {
      left: point.x - size.width / 2,
      right: point.x + size.width / 2,
      top: point.y - size.height / 2,
      bottom: point.y + size.height / 2,
    };
  });
  for (let index = 0; index < rectangles.length; index += 1) {
    const rectangle = rectangles[index];
    if (rectangle.left < edge || rectangle.top < edge || rectangle.right > width - edge || rectangle.bottom > height - edge) return false;
    if (overlapping(rectangle, center, gap)) return false;
    for (let other = 0; other < index; other += 1) {
      if (overlapping(rectangle, rectangles[other], gap)) return false;
    }
  }
  return true;
}

export function computeOrbitLayout({ width, height, nodes, presentation = "auto", maxVisible = 12 }) {
  if (!Array.isArray(nodes)) fail("Orbit layout nodes must be an array");
  const safeWidth = Math.max(0, finite(width, 0));
  const safeHeight = Math.max(0, finite(height, 0));
  const limit = boundedInteger(maxVisible, 12, 4, 32);
  if (unconditionallyUsesList(safeWidth, safeHeight, nodes.length, presentation, limit)) return listLayout(nodes);
  const contentPressure = nodes.some((node) => finite(node.titleUnits, 0) > 34);
  if (contentPressure) return listLayout(nodes);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const placements = resolveOrbitSemanticOrder(nodes);
  const detailById = new Map(resolveOrbitSemanticDetail({ width: safeWidth, height: safeHeight, mode: "spatial", nodes, placements })
    .map((entry) => [entry.id, entry.detail]));
  const groups = [[], [], []];
  for (const placement of placements) groups[placement.ring - 1].push(nodeById.get(placement.id));
  const centerX = safeWidth / 2;
  const centerY = safeHeight / 2;
  const radii = [
    [Math.max(170, safeWidth * 0.31), Math.max(145, safeHeight * 0.29)],
    [Math.max(245, safeWidth * 0.41), Math.max(205, safeHeight * 0.39)],
    [Math.max(300, safeWidth * 0.47), Math.max(245, safeHeight * 0.46)],
  ];
  const points = [];
  groups.forEach((group, ringIndex) => {
    const [radiusX, radiusY] = radii[ringIndex];
    group.forEach((node, index) => {
      const angle = -Math.PI / 2 + ((Math.PI * 2 * index) / group.length) + ringIndex * 0.19;
      points.push(Object.freeze({
        id: node.id,
        x: Math.round((centerX + Math.cos(angle) * radiusX) * 100) / 100,
        y: Math.round((centerY + Math.sin(angle) * radiusY) * 100) / 100,
        ring: ringIndex + 1,
        detail: detailById.get(node.id) ?? "preview",
      }));
    });
  });
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  points.sort((left, right) => order.get(left.id) - order.get(right.id));
  if (!spatialLayoutIsSafe(safeWidth, safeHeight, nodes, points)) return listLayout(nodes);
  return Object.freeze({ mode: "spatial", points: Object.freeze(points) });
}

export function resolveOrbitTabStop(elements, { activeElement = null, rememberedId = null, selectedElement = null } = {}) {
  if (!Array.isArray(elements) || elements.length === 0) return null;
  if (elements.includes(activeElement)) return activeElement;
  if (typeof rememberedId === "string") {
    const remembered = elements.find((element) => element?.dataset?.luastraId === rememberedId);
    if (remembered) return remembered;
  }
  if (elements.includes(selectedElement)) return selectedElement;
  return elements[0];
}

export function createOrbitController({
  root,
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (handle) => cancelAnimationFrame(handle),
  measureTime = null,
}) {
  if (!root?.querySelectorAll || !root?.addEventListener) fail("Orbit controller requires a DOM root");
  if (measureTime !== null && typeof measureTime !== "function") fail("Orbit measureTime must be a function or null");
  let frame = null;
  let destroyed = false;
  const orbitStates = new WeakMap();
  const managedOrbits = new Set();
  const layoutMetrics = {
    passes: 0,
    totalDurationMs: 0,
    lastDurationMs: 0,
    maxDurationMs: 0,
    lastOrbitCount: 0,
    lastNodeCount: 0,
    lastConstellationCount: 0,
    cameraTransitions: 0,
    lastCameraTransition: null,
  };

  const stateFor = (orbit) => {
    let state = orbitStates.get(orbit);
    if (!state) {
      state = {
        activeConstellationId: null,
        activation: null,
        cameraAnimation: null,
        constellationElements: new WeakSet(),
        focusAnimation: null,
        focusByConstellation: new Map(),
        focusOrigin: null,
        focusSurfaceNodeId: null,
        focusSurfaceOpen: false,
        mode: null,
        preferencesBootstrapped: false,
      };
      orbitStates.set(orbit, state);
      managedOrbits.add(orbit);
    }
    return state;
  };

  const rememberFocusedNode = (orbit) => {
    const activeElement = root.ownerDocument.activeElement;
    const node = activeElement?.closest?.(".luastra-orbit-node");
    const constellation = node?.closest?.(".luastra-constellation");
    if (!node || !constellation || node.closest?.(".luastra-orbit") !== orbit) return;
    const constellationId = constellation.dataset.luastraId;
    const nodeId = node.dataset.luastraId;
    if (constellationId && nodeId) stateFor(orbit).focusByConstellation.set(constellationId, nodeId);
  };

  const visibleNodes = (constellation) => [...constellation.querySelectorAll(":scope > .luastra-orbit-node")]
    .filter((node) => !node.hidden);
  const interactiveNodes = (constellation) => visibleNodes(constellation).filter((node) => !node.disabled);

  const bootstrapPreferences = (orbit, orbitState) => {
    if (orbitState.preferencesBootstrapped) return;
    orbitState.preferencesBootstrapped = true;
    const projectId = root.ownerDocument.documentElement?.dataset?.luastraProject;
    if (typeof projectId !== "string" || !/^[a-z][a-z0-9._-]{0,127}$/.test(projectId)) return;
    let stored = null;
    try { stored = root.ownerDocument.defaultView?.localStorage?.getItem(`luastra.${projectId}.orbit-preferences`) ?? null; }
    catch { return; }
    const preferences = decodeOrbitPreferences(stored);
    if (!preferences) return;
    for (const name of [...orbit.classList]) {
      if (name.startsWith("luastra-orbit-theme-") || name.startsWith("luastra-orbit-motion-")) orbit.classList.remove(name);
    }
    orbit.classList.add(`luastra-orbit-theme-${preferences.theme}`, `luastra-orbit-motion-${preferences.motion}`);
  };

  const motionReduced = (orbit) => classValue(orbit, "luastra-orbit-motion-", "system") === "off" ||
    root.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  const animateConstellationEntry = (orbit, orbitState, constellation, fromState) => {
    const activation = orbitState.activation;
    orbitState.activation = null;
    if (fromState === "ahead") {
      const source = activation && [...orbit.querySelectorAll(".luastra-orbit-node")]
        .find((candidate) => candidate.dataset.luastraId === activation.id);
      const now = root.ownerDocument.defaultView?.performance?.now?.() ?? Date.now();
      const sourceKind = source ? classValue(source, "luastra-orbit-kind-", "leaf") : "leaf";
      if (!activation || now - activation.capturedAt > 1500 || (sourceKind !== "constellation" && sourceKind !== "cluster")) return;
    }
    orbitState.cameraAnimation?.cancel?.();
    orbitState.cameraAnimation = null;
    if (motionReduced(orbit)) return;
    layoutMetrics.cameraTransitions += 1;
    layoutMetrics.lastCameraTransition = fromState;
    if (measureTime !== null) {
      root.dataset.luastraOrbitCameraTransitions = String(layoutMetrics.cameraTransitions);
      root.dataset.luastraOrbitCameraTransitionLast = fromState;
    }
    const style = root.ownerDocument.defaultView?.getComputedStyle?.(orbit);
    const duration = parseOrbitDuration(style?.getPropertyValue("--luastra-orbit-camera-duration") ?? "", 840);
    const view = root.ownerDocument.defaultView;
    let settled = false;
    let timer = null;
    const settle = (event = null) => {
      if (settled || (event !== null && event.target !== constellation)) return;
      settled = true;
      constellation.removeEventListener("animationend", settle);
      if (timer !== null) view?.clearTimeout?.(timer);
      delete constellation.dataset.luastraOrbitTransition;
      if (orbitState.cameraAnimation === managedAnimation) orbitState.cameraAnimation = null;
    };
    const managedAnimation = Object.freeze({ cancel: settle });
    orbitState.cameraAnimation = managedAnimation;
    constellation.addEventListener("animationend", settle);
    constellation.dataset.luastraOrbitTransition = `entering-${fromState}`;
    timer = view?.setTimeout?.(settle, duration + 100) ?? null;
  };

  const animateFocusSurface = (orbit, orbitState, surface) => {
    const activation = orbitState.activation;
    const selected = orbit.querySelector(".luastra-orbit-node.luastra-orbit-selected");
    const now = root.ownerDocument.defaultView?.performance?.now?.() ?? Date.now();
    if (!activation || activation.id !== selected?.dataset?.luastraId || now - activation.capturedAt > 1500) return;
    orbitState.activation = null;
    orbitState.focusOrigin = { id: activation.id, borderRadius: activation.borderRadius };
    if (motionReduced(orbit) || typeof surface.animate !== "function") return;
    const target = surface.getBoundingClientRect();
    const geometry = focusTransitionGeometry(activation.rect, target);
    if (!geometry) return;
    orbitState.focusAnimation?.cancel?.();
    surface.dataset.luastraOrbitTransition = "opening";
    const style = root.ownerDocument.defaultView?.getComputedStyle?.(orbit);
    const duration = parseOrbitDuration(style?.getPropertyValue("--luastra-orbit-focus-duration") ?? "", 620);
    const animation = surface.animate([
      {
        borderRadius: activation.borderRadius,
        opacity: 0.35,
        transform: `translate(${geometry.translateX}px, ${geometry.translateY}px) scale(${geometry.scaleX}, ${geometry.scaleY})`,
        transformOrigin: "center",
      },
      { borderRadius: style?.getPropertyValue("--luastra-orbit-focus-radius")?.trim() || "22px", opacity: 1, transform: "none", transformOrigin: "center" },
    ], { duration, easing: "cubic-bezier(.2, .75, .2, 1)" });
    let managedAnimation = null;
    managedAnimation = manageOrbitAnimation(animation, () => {
      if (orbitState.focusAnimation !== managedAnimation) return;
      orbitState.focusAnimation = null;
      delete surface.dataset.luastraOrbitTransition;
    });
    orbitState.focusAnimation = managedAnimation;
  };

  const syncFocusSurface = (orbit, orbitState) => {
    const surface = orbit.querySelector(":scope > .luastra-focus-surface");
    const open = surface?.hasAttribute?.("open") === true;
    const heading = surface?.querySelector?.("h1, h2, h3, h4, h5, h6");
    if (heading?.id) surface.setAttribute("aria-labelledby", heading.id);
    if (open) {
      const selected = orbit.querySelector(".luastra-orbit-node.luastra-orbit-selected");
      if (selected?.dataset?.luastraId) orbitState.focusSurfaceNodeId = selected.dataset.luastraId;
    }
    if (open && !orbitState.focusSurfaceOpen) {
      if (heading) {
        heading.tabIndex = -1;
        surface.scrollTop = 0;
        heading.focus({ preventScroll: true });
        surface.scrollTop = 0;
      }
      animateFocusSurface(orbit, orbitState, surface);
    }
    if (!open && orbitState.focusSurfaceOpen) {
      orbitState.focusAnimation?.cancel?.();
      orbitState.focusAnimation = null;
      if (surface) delete surface.dataset.luastraOrbitTransition;
      const activeConstellation = orbit.querySelector(":scope > .luastra-constellation-state-active");
      const selected = [...(activeConstellation?.querySelectorAll?.(".luastra-orbit-node") ?? [])]
        .find((node) => node.dataset.luastraId === orbitState.focusSurfaceNodeId);
      const activeElement = root.ownerDocument.activeElement;
      if (selected && (!activeElement || !activeConstellation?.contains?.(activeElement))) {
        selected.focus({ preventScroll: true });
      }
      orbitState.focusSurfaceNodeId = null;
    }
    orbitState.focusSurfaceOpen = open;
  };

  const layoutOrbit = (orbit) => {
    rememberFocusedNode(orbit);
    const orbitState = stateFor(orbit);
    bootstrapPreferences(orbit, orbitState);
    const presentation = classValue(orbit, "luastra-orbit-presentation-", "auto");
    const theme = classValue(orbit, "luastra-orbit-theme-", "luastra");
    const motion = classValue(orbit, "luastra-orbit-motion-", "system");
    const maxVisible = boundedInteger(classValue(orbit, "luastra-orbit-max-", "12"), 12, 4, 32);
    orbit.dataset.luastraOrbitPresentation = presentation;
    orbit.dataset.luastraOrbitTheme = theme;
    orbit.dataset.luastraOrbitMotion = motion;
    orbit.dataset.luastraOrbitMaxVisible = String(maxVisible);
    const focusSurfaceOpen = orbit.querySelector(":scope > .luastra-focus-surface[open]") !== null;
    const constellationLayers = [...orbit.querySelectorAll(":scope > .luastra-constellation")];
    const activeLayer = constellationLayers.find((layer) => classValue(layer, "luastra-constellation-state-", "active") === "active") ?? null;
    const activeLayerWasKnown = activeLayer === null || orbitState.constellationElements.has(activeLayer);
    for (const layer of constellationLayers) {
      orbitState.constellationElements.add(layer);
      const state = classValue(layer, "luastra-constellation-state-", "active");
      const depth = boundedInteger(classValue(layer, "luastra-constellation-depth-", "0"), 0, 0, 32);
      layer.dataset.luastraConstellationState = state;
      layer.style.setProperty("--luastra-constellation-depth", String(depth));
      layer.inert = state !== "active";
      layer.setAttribute("role", "region");
      if (state === "active") {
        layer.removeAttribute("aria-hidden");
        layer.setAttribute("aria-live", "polite");
        layer.setAttribute("aria-atomic", "true");
      } else {
        layer.setAttribute("aria-hidden", "true");
        layer.removeAttribute("aria-live");
        layer.removeAttribute("aria-atomic");
      }
    }
    for (const element of orbit.querySelectorAll(".luastra-orbit-node")) {
      const nodeKind = classValue(element, "luastra-orbit-kind-", "leaf");
      const selected = element.classList.contains("luastra-orbit-selected");
      if (element.dataset.luastraOrbitNodeKind !== nodeKind) element.dataset.luastraOrbitNodeKind = nodeKind;
      if (element.hasAttribute("aria-pressed")) element.removeAttribute("aria-pressed");
      if (selected) {
        if (element.getAttribute("aria-current") !== "page") element.setAttribute("aria-current", "page");
      } else if (element.hasAttribute("aria-current")) element.removeAttribute("aria-current");
      if (nodeKind === "leaf") {
        if (element.getAttribute("aria-haspopup") !== "dialog") element.setAttribute("aria-haspopup", "dialog");
        const expanded = selected && focusSurfaceOpen ? "true" : "false";
        if (element.getAttribute("aria-expanded") !== expanded) element.setAttribute("aria-expanded", expanded);
      } else {
        if (element.hasAttribute("aria-haspopup")) element.removeAttribute("aria-haspopup");
        if (element.hasAttribute("aria-expanded")) element.removeAttribute("aria-expanded");
      }
      const status = element.querySelector(":scope > .luastra-orbit-node-status");
      if (nodeKind === "action" && status) status.setAttribute("role", "status");
      else status?.removeAttribute("role");
    }
    const constellation = activeLayer;
    if (!constellation) return;
    const constellationId = constellation.dataset.luastraId ?? null;
    const activeConstellationChanged = orbitState.activeConstellationId !== null && orbitState.activeConstellationId !== constellationId;
    orbitState.activeConstellationId = constellationId;
    const elements = visibleNodes(constellation);
    const focusableElements = interactiveNodes(constellation);
    const pathHeight = orbit.querySelector(":scope > .luastra-orbit-path")?.clientHeight ?? 0;
    const searchHeight = orbit.querySelector(":scope > .luastra-orbit-search")?.clientHeight ?? 0;
    const layoutWidth = orbit.clientWidth;
    const layoutHeight = Math.max(0, orbit.clientHeight - pathHeight - searchHeight);
    const simpleList = unconditionallyUsesList(layoutWidth, layoutHeight, elements.length, presentation, maxVisible);
    const nodes = simpleList ? elements.map((element) => ({ id: element.dataset.luastraId })) : elements.map((element) => {
      const labels = [...element.querySelectorAll(":scope > .luastra-text")];
      const units = (value) => [...String(value ?? "").trim()].length;
      const titleUnits = units(labels[0]?.textContent);
      const descriptionUnits = labels.slice(1).reduce((total, label) => total + units(label.textContent), 0);
      return {
        id: element.dataset.luastraId,
        ring: Number(classValue(element, "luastra-orbit-ring-", "0")),
        priority: Number(classValue(element, "luastra-orbit-priority-", "2")),
        relatedTo: (element.dataset.luastraOrbitRelatedTo ?? "").split(",").filter(Boolean),
        signalIcon: element.dataset.luastraOrbitSignalIcon,
        hasStatus: [...element.classList].some((name) => name.startsWith("luastra-orbit-status-")),
        titleUnits,
        descriptionUnits,
        labelUnits: titleUnits + descriptionUnits,
      };
    });
    const layout = computeOrbitLayout({
      width: layoutWidth,
      height: layoutHeight,
      nodes,
      presentation,
      maxVisible,
    });
    const pointById = new Map(layout.points.map((point) => [point.id, point]));
    if (layout.mode === "spatial") {
      for (const element of elements) {
        const point = pointById.get(element.dataset.luastraId);
        element.style.setProperty("--luastra-orbit-x", `${point.x}px`);
        element.style.setProperty("--luastra-orbit-y", `${point.y}px`);
        element.dataset.luastraOrbitRingResolved = String(point.ring);
      }
    }
    syncOrbitSemanticDetail(elements, pointById, layout.mode);
    syncOrbitRelationships(constellation, elements, layout, pointById);
    const previousMode = orbitState.mode;
    orbit.dataset.luastraOrbitMode = layout.mode;
    orbit.dataset.luastraOrbitReady = "true";
    orbitState.mode = layout.mode;
    if (activeConstellationChanged) {
      if (previousMode === "list") animateConstellationEntry(orbit, orbitState, constellation, "behind");
      else if (!activeLayerWasKnown) animateConstellationEntry(orbit, orbitState, constellation, "ahead");
      else orbitState.activation = null;
    }

    const focused = focusableElements.includes(root.ownerDocument.activeElement) ? root.ownerDocument.activeElement : null;
    const selected = focusableElements.find((node) => node.classList.contains("luastra-orbit-selected"));
    const tabStop = resolveOrbitTabStop(focusableElements, {
      activeElement: focused,
      rememberedId: constellationId === null ? null : orbitState.focusByConstellation.get(constellationId),
      selectedElement: selected,
    });
    for (const element of elements) {
      const tabIndex = element === tabStop ? 0 : -1;
      if (element.tabIndex !== tabIndex) element.tabIndex = tabIndex;
    }
    if (activeConstellationChanged && tabStop && !orbit.querySelector(":scope > .luastra-focus-surface[open]")) {
      tabStop.focus({ preventScroll: true });
    }
    syncFocusSurface(orbit, orbitState);
  };

  const flush = () => {
    frame = null;
    if (destroyed) return;
    const orbits = [...root.querySelectorAll(".luastra-orbit")];
    const started = measureTime?.();
    for (const orbit of orbits) layoutOrbit(orbit);
    if (started !== undefined) {
      const duration = Math.max(0, finite(measureTime() - started, 0));
      layoutMetrics.passes += 1;
      layoutMetrics.totalDurationMs += duration;
      layoutMetrics.lastDurationMs = duration;
      layoutMetrics.maxDurationMs = Math.max(layoutMetrics.maxDurationMs, duration);
      layoutMetrics.lastOrbitCount = orbits.length;
      layoutMetrics.lastNodeCount = orbits.reduce((total, orbit) => total + orbit.querySelectorAll(".luastra-orbit-node").length, 0);
      layoutMetrics.lastConstellationCount = orbits.reduce((total, orbit) => total + orbit.querySelectorAll(":scope > .luastra-constellation").length, 0);
      root.dataset.luastraOrbitLayoutPasses = String(layoutMetrics.passes);
      root.dataset.luastraOrbitLayoutLastMs = duration.toFixed(3);
      root.dataset.luastraOrbitLayoutMaxMs = layoutMetrics.maxDurationMs.toFixed(3);
      root.dataset.luastraOrbitNodeCount = String(layoutMetrics.lastNodeCount);
      root.dataset.luastraOrbitConstellationCount = String(layoutMetrics.lastConstellationCount);
    }
  };
  const sync = () => {
    if (destroyed || frame !== null) return;
    frame = requestFrame(flush);
  };

  const deferFocusSurfaceClose = (surface, complete) => {
    const orbit = surface?.closest?.(".luastra-orbit");
    if (!orbit || typeof complete !== "function") return false;
    const orbitState = stateFor(orbit);
    const origin = orbitState.focusOrigin;
    const node = origin && [...orbit.querySelectorAll(".luastra-orbit-node")]
      .find((candidate) => candidate.dataset.luastraId === origin.id);
    if (!node || motionReduced(orbit) || typeof surface.animate !== "function") return false;
    const source = node.getBoundingClientRect();
    const target = surface.getBoundingClientRect();
    const geometry = focusTransitionGeometry(source, target);
    if (!geometry) return false;
    orbitState.focusAnimation?.cancel?.();
    let visualSnapshot = null;
    if (typeof surface.cloneNode === "function" && root.ownerDocument.createElement) {
      visualSnapshot = root.ownerDocument.createElement("div");
      visualSnapshot.className = "luastra-focus-transition-copy";
      visualSnapshot.setAttribute("aria-hidden", "true");
      visualSnapshot.inert = true;
      for (const child of [...surface.children]) visualSnapshot.append(child.cloneNode(true));
      for (const element of [visualSnapshot, ...visualSnapshot.querySelectorAll("[id], [data-luastra-id], button, input, select, textarea, a")]) {
        element.removeAttribute?.("id");
        delete element.dataset?.luastraId;
        if ("tabIndex" in element) element.tabIndex = -1;
        if ("disabled" in element) element.disabled = true;
      }
      surface.append(visualSnapshot);
    }
    surface.dataset.luastraOrbitTransition = "closing";
    const style = root.ownerDocument.defaultView?.getComputedStyle?.(orbit);
    const duration = parseOrbitDuration(style?.getPropertyValue("--luastra-orbit-focus-duration") ?? "", 620);
    const animation = surface.animate([
      { borderRadius: style?.getPropertyValue("--luastra-orbit-focus-radius")?.trim() || "22px", opacity: 1, transform: "none", transformOrigin: "center" },
      {
        borderRadius: origin.borderRadius,
        opacity: 0.35,
        transform: `translate(${geometry.translateX}px, ${geometry.translateY}px) scale(${geometry.scaleX}, ${geometry.scaleY})`,
        transformOrigin: "center",
      },
    ], { duration, easing: "cubic-bezier(.4, 0, .2, 1)" });
    let managedAnimation = null;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (orbitState.focusAnimation === managedAnimation) orbitState.focusAnimation = null;
      visualSnapshot?.remove?.();
      delete surface.dataset.luastraOrbitTransition;
      if (complete()) {
        orbitState.focusSurfaceOpen = false;
        orbitState.focusOrigin = null;
        orbitState.focusSurfaceNodeId = null;
      }
    };
    managedAnimation = manageOrbitAnimation(animation, settle);
    orbitState.focusAnimation = managedAnimation;
    return () => managedAnimation.cancel();
  };

  const onKeyDown = (event) => {
    const search = event.target?.closest?.(".luastra-orbit-search");
    if (search && event.key === "Escape" && event.isComposing !== true && typeof event.target?.value === "string" && event.target.value.length > 0) {
      event.preventDefault();
      event.target.value = "";
      const EventConstructor = root.ownerDocument.defaultView?.Event;
      if (EventConstructor) event.target.dispatchEvent(new EventConstructor("input", { bubbles: true }));
      return;
    }
    const editable = event.target?.matches?.("input, textarea, select, [contenteditable='true']") === true;
    if (event.key === "/" && !editable && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const orbit = event.target?.closest?.(".luastra-orbit") ?? root.querySelector(".luastra-orbit");
      const searchInput = orbit?.querySelector?.(":scope > .luastra-orbit-search input:not(:disabled)");
      if (searchInput) {
        event.preventDefault();
        searchInput.focus({ preventScroll: true });
        searchInput.select?.();
        return;
      }
    }
    const focusSurface = event.target?.closest?.(".luastra-focus-surface");
    if (focusSurface) {
      if (event.key === "Escape") {
        event.preventDefault();
        const EventConstructor = root.ownerDocument.defaultView?.Event;
        if (EventConstructor) focusSurface.dispatchEvent(new EventConstructor("cancel", { cancelable: true }));
      }
      return;
    }
    const node = event.target?.closest?.(".luastra-orbit-node");
    const constellation = node?.closest?.(".luastra-constellation-state-active");
    if (node && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      node.click();
      return;
    }
    if (event.key === "Escape") {
      const orbit = (constellation ?? node)?.closest?.(".luastra-orbit") ?? root.querySelector(".luastra-orbit");
      const returnControl = orbit?.querySelector(".luastra-orbit-return:not(:disabled)");
      if (!returnControl) return;
      event.preventDefault();
      returnControl.click();
      return;
    }
    if (!constellation) {
      return;
    }
    const elements = interactiveNodes(constellation);
    const currentIndex = elements.indexOf(node);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = elements.length - 1;
    else if (directionVectors[event.key]) {
      const points = elements.map((element) => ({
        x: Number.parseFloat(element.style.getPropertyValue("--luastra-orbit-x")) || 0,
        y: Number.parseFloat(element.style.getPropertyValue("--luastra-orbit-y")) || elements.indexOf(element),
      }));
      nextIndex = nearestDirectionalNode(points, currentIndex, event.key);
    } else return;
    event.preventDefault();
    if (nextIndex === currentIndex) return;
    elements.forEach((element, index) => { element.tabIndex = index === nextIndex ? 0 : -1; });
    elements[nextIndex]?.focus();
  };

  const onFocusIn = (event) => {
    const orbit = event.target?.closest?.(".luastra-orbit");
    if (orbit) rememberFocusedNode(orbit);
  };

  const onActivationCapture = (event) => {
    const node = event.target?.closest?.(".luastra-orbit-node");
    const orbit = node?.closest?.(".luastra-orbit");
    if (!node || !orbit || node.disabled || node.hidden) return;
    const rect = node.getBoundingClientRect();
    const orbitRect = orbit.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || orbitRect.width <= 0 || orbitRect.height <= 0) return;
    const view = root.ownerDocument.defaultView;
    const x = Math.min(100, Math.max(0, ((rect.left + rect.width / 2 - orbitRect.left) / orbitRect.width) * 100));
    const y = Math.min(100, Math.max(0, ((rect.top + rect.height / 2 - orbitRect.top) / orbitRect.height) * 100));
    orbit.style.setProperty("--luastra-orbit-origin-x", `${x}%`);
    orbit.style.setProperty("--luastra-orbit-origin-y", `${y}%`);
    stateFor(orbit).activation = {
      id: node.dataset.luastraId ?? "",
      capturedAt: view?.performance?.now?.() ?? Date.now(),
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      borderRadius: view?.getComputedStyle?.(node)?.borderRadius || "16px",
    };
  };

  root.addEventListener("click", onActivationCapture, true);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("focusin", onFocusIn);
  const Observer = root.ownerDocument.defaultView?.ResizeObserver;
  const observer = Observer ? new Observer(() => {
    for (const orbit of managedOrbits) {
      orbitStates.get(orbit)?.focusAnimation?.cancel?.();
    }
    sync();
  }) : null;
  if (observer) observer.observe(root);
  sync();
  return Object.freeze({
    sync,
    deferFocusSurfaceClose,
    diagnostics() {
      const averageDurationMs = layoutMetrics.passes === 0 ? 0 : layoutMetrics.totalDurationMs / layoutMetrics.passes;
      return Object.freeze({
        layoutPasses: layoutMetrics.passes,
        averageLayoutDurationMs: averageDurationMs,
        lastLayoutDurationMs: layoutMetrics.lastDurationMs,
        maxLayoutDurationMs: layoutMetrics.maxDurationMs,
        orbitCount: layoutMetrics.lastOrbitCount,
        nodeCount: layoutMetrics.lastNodeCount,
        constellationCount: layoutMetrics.lastConstellationCount,
        cameraTransitions: layoutMetrics.cameraTransitions,
        lastCameraTransition: layoutMetrics.lastCameraTransition,
      });
    },
    destroy() {
      destroyed = true;
      if (frame !== null) cancelFrame(frame);
      observer?.disconnect();
      for (const orbit of managedOrbits) {
        const orbitState = orbitStates.get(orbit);
        orbitState?.cameraAnimation?.cancel?.();
        orbitState?.focusAnimation?.cancel?.();
        for (const layer of orbit.querySelectorAll?.(":scope > .luastra-constellation") ?? []) delete layer.dataset.luastraOrbitTransition;
        const surface = orbit.querySelector?.(":scope > .luastra-focus-surface");
        if (surface) delete surface.dataset.luastraOrbitTransition;
      }
      managedOrbits.clear();
      delete root.dataset.luastraOrbitLayoutPasses;
      delete root.dataset.luastraOrbitLayoutLastMs;
      delete root.dataset.luastraOrbitLayoutMaxMs;
      delete root.dataset.luastraOrbitNodeCount;
      delete root.dataset.luastraOrbitConstellationCount;
      delete root.dataset.luastraOrbitCameraTransitions;
      delete root.dataset.luastraOrbitCameraTransitionLast;
      root.removeEventListener("click", onActivationCapture, true);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("focusin", onFocusIn);
    },
  });
}
