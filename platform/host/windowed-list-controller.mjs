const minimumSmallListItems = 12;
const maximumRememberedMeasurements = 2048;

function fail(message) { throw new Error(message); }
function finitePositive(value) { return Number.isFinite(value) && value > 0; }
function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }

function requestReliableFrame(view, callback) {
  let active = true;
  let timeout = null;
  const complete = (timestamp) => {
    if (!active) return;
    active = false;
    if (timeout !== null) view.clearTimeout(timeout);
    callback(timestamp);
  };
  const frame = view.requestAnimationFrame(complete);
  timeout = view.setTimeout(() => complete(view.performance?.now?.() ?? Date.now()), 100);
  return Object.freeze({
    cancel() {
      if (!active) return;
      active = false;
      view.cancelAnimationFrame(frame);
      if (timeout !== null) view.clearTimeout(timeout);
    },
  });
}

export function computeWindow({ sizes, viewportStart, viewportEnd, overscan, focusedIndex = -1, pinnedIndices = [] }) {
  if (!Array.isArray(sizes) || !sizes.every(finitePositive)) fail("window sizes must be positive finite numbers");
  if (!Number.isFinite(viewportStart) || !Number.isFinite(viewportEnd) || viewportEnd < viewportStart) fail("window viewport is invalid");
  if (!Number.isInteger(overscan) || overscan < 1 || overscan > 64) fail("window overscan is invalid");
  if (!Number.isInteger(focusedIndex) || focusedIndex < -1 || focusedIndex >= sizes.length) fail("window focused index is invalid");
  if (!Array.isArray(pinnedIndices) || !pinnedIndices.every((index) => Number.isInteger(index) && index >= 0 && index < sizes.length)) fail("window pinned indices are invalid");
  if (sizes.length === 0) return Object.freeze({ start: 0, end: 0, visibleStart: 0, visibleEnd: 0, leading: 0, trailing: 0, total: 0 });

  const total = sizes.reduce((sum, size) => sum + size, 0);
  const visibleStartPosition = clamp(viewportStart, 0, Math.max(0, total - 1));
  const visibleEndPosition = clamp(Math.max(viewportEnd, visibleStartPosition + 1), 1, total);
  let cursor = 0;
  let visibleStart = sizes.length - 1;
  let visibleEnd = sizes.length;
  for (let index = 0; index < sizes.length; index += 1) {
    const next = cursor + sizes[index];
    if (visibleStart === sizes.length - 1 && next > visibleStartPosition) visibleStart = index;
    if (next >= visibleEndPosition) {
      visibleEnd = index + 1;
      break;
    }
    cursor = next;
  }

  let start = Math.max(0, visibleStart - overscan);
  let end = Math.min(sizes.length, visibleEnd + overscan);
  for (const index of [...pinnedIndices, focusedIndex].filter((value) => value >= 0)) {
    start = Math.min(start, Math.max(0, index - 1));
    end = Math.max(end, Math.min(sizes.length, index + 2));
  }
  const leading = sizes.slice(0, start).reduce((sum, size) => sum + size, 0);
  const trailing = sizes.slice(end).reduce((sum, size) => sum + size, 0);
  return Object.freeze({ start, end, visibleStart, visibleEnd, leading, trailing, total });
}

function semanticLists(root) {
  const lists = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "List" && node.attributes?.["data-luastra-list-mode"] === "windowed") lists.push(node);
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);
  return lists;
}

function numericAttribute(node, name, fallback = null) {
  const value = node.attributes?.[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function findScrollViewport(list) {
  const view = list.ownerDocument?.defaultView;
  const listRect = list.getBoundingClientRect();
  let ancestor = list.parentElement;
  while (ancestor && ancestor !== list.ownerDocument?.body && ancestor !== list.ownerDocument?.documentElement) {
    const style = view?.getComputedStyle?.(ancestor);
    if (/(auto|scroll)/.test(style?.overflowY ?? "") && ancestor.clientHeight > 0) {
      const rect = ancestor.getBoundingClientRect();
      return {
        start: rect.top - listRect.top,
        end: rect.bottom - listRect.top,
        top: rect.top,
        bottom: rect.bottom,
        eventTarget: ancestor,
        scrollBy: (delta) => { ancestor.scrollTop += delta; },
      };
    }
    ancestor = ancestor.parentElement;
  }
  const height = Number.isFinite(view?.innerHeight) ? view.innerHeight : list.ownerDocument?.documentElement?.clientHeight ?? 0;
  return {
    start: -listRect.top,
    end: height - listRect.top,
    top: 0,
    bottom: height,
    eventTarget: view ?? null,
    scrollBy: (delta) => view?.scrollBy?.(0, delta),
  };
}

function makeSpacer(document, edge) {
  const spacer = document.createElement("li");
  spacer.className = `luastra-window-spacer luastra-window-spacer-${edge}`;
  spacer.setAttribute("aria-hidden", "true");
  spacer.setAttribute("role", "presentation");
  spacer.style.display = "block";
  spacer.style.listStyle = "none";
  spacer.style.margin = "0";
  spacer.style.padding = "0";
  spacer.style.border = "0";
  spacer.style.pointerEvents = "none";
  return spacer;
}

function mergeRealizedRanges(window, itemCount, pinnedIndices) {
  const ranges = [{ start: window.start, end: window.end }];
  for (const index of pinnedIndices) ranges.push({ start: Math.max(0, index - 1), end: Math.min(itemCount, index + 2) });
  ranges.sort((left, right) => left.start - right.start);
  const merged = [];
  for (const range of ranges) {
    if (range.end <= range.start) continue;
    const previous = merged.at(-1);
    if (!previous || range.start > previous.end) merged.push({ ...range });
    else previous.end = Math.max(previous.end, range.end);
  }
  return merged;
}

function rangeSize(sizes, start, end) {
  let total = 0;
  for (let index = start; index < end; index += 1) total += sizes[index];
  return total;
}

function placeSequence(parent, desired) {
  for (let index = 0; index < desired.length; index += 1) {
    const current = parent.children[index] ?? null;
    if (current !== desired[index]) parent.insertBefore(desired[index], current);
  }
  const keep = new Set(desired);
  for (const child of [...parent.children]) if (!keep.has(child)) child.remove();
}

function rememberHeight(state, id, height) {
  if (!finitePositive(height)) return false;
  const normalized = Math.max(1, Math.round(height * 100) / 100);
  if (state.heights.get(id) === normalized) return false;
  state.heights.delete(id);
  state.heights.set(id, normalized);
  while (state.heights.size > maximumRememberedMeasurements) state.heights.delete(state.heights.keys().next().value);
  return true;
}

function measureConnected(state) {
  let changed = false;
  for (const id of state.realized) {
    const node = state.items.get(id);
    if (!node?.isConnected) continue;
    changed = rememberHeight(state, id, node.getBoundingClientRect?.().height) || changed;
  }
  return changed;
}

function applyItemMetadata(state) {
  const count = state.config.itemCount;
  for (let index = 0; index < state.order.length; index += 1) {
    const item = state.items.get(state.order[index]);
    if (!item) continue;
    item.setAttribute("aria-posinset", String(state.config.itemOffset + index + 1));
    if (count === null) item.removeAttribute("aria-setsize");
    else item.setAttribute("aria-setsize", String(count));
  }
}

function captureAnchor(state) {
  if (state.realized.length === 0) return null;
  const viewport = state.viewport(state.element);
  const viewportBottom = Number.isFinite(viewport.bottom) ? viewport.bottom : viewport.top + Math.max(0, viewport.end - viewport.start);
  const candidates = [];
  for (const id of state.realized) {
    const item = state.items.get(id);
    if (!item?.isConnected) continue;
    const rect = item.getBoundingClientRect?.();
    if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.bottom)) continue;
    if (rect.bottom > viewport.top && rect.top < viewportBottom) candidates.push({ id, top: rect.top });
  }
  return candidates.length === 0 ? null : Object.freeze(candidates);
}

function restoreAnchor(state) {
  const candidates = state.pendingAnchor;
  state.pendingAnchor = null;
  if (!candidates) return;
  for (const candidate of candidates) {
    if (!state.order.includes(candidate.id)) continue;
    const item = state.items.get(candidate.id);
    if (!item?.isConnected) continue;
    const top = item.getBoundingClientRect?.().top;
    if (!Number.isFinite(top)) continue;
    const delta = top - candidate.top;
    if (Math.abs(delta) >= 0.5) {
      state.viewport(state.element).scrollBy(delta);
      state.schedule?.(false);
    }
    return;
  }
}

function rememberStableAnchor(state) {
  state.stableAnchor = captureAnchor(state);
}

function continueViewportSettlement(state) {
  if (state.viewportPasses <= 0) return;
  state.viewportPasses -= 1;
  if (state.viewportPasses > 0) {
    state.pendingAnchor = state.viewportAnchor;
    state.schedule?.(false);
  } else {
    state.viewportAnchor = null;
  }
}

function attachCompleteList(state, marker) {
  state.observer?.disconnect();
  placeSequence(state.element, state.order.map((id) => state.items.get(id)).filter(Boolean));
  state.realized = [...state.order];
  state.element.dataset.luastraListWindowState = marker;
  for (const id of state.realized) state.observer?.observe(state.items.get(id));
  const measurementsChanged = measureConnected(state);
  if (measurementsChanged) state.pendingAnchor ??= state.stableAnchor;
  restoreAnchor(state);
  rememberStableAnchor(state);
  continueViewportSettlement(state);
}

function updateScrollTarget(state, target) {
  if (state.scrollTarget === target) return;
  state.scrollTarget?.removeEventListener?.("scroll", state.onScroll);
  state.scrollTarget = target;
  state.scrollTarget?.addEventListener?.("scroll", state.onScroll, { passive: true });
}

function edgeToken(state, edge) {
  const boundary = edge === "start" ? state.order[0] : state.order.at(-1);
  const action = edge === "start" ? state.config.startAction : state.config.endAction;
  return action && boundary ? `${action}\u0000${boundary}\u0000${state.config.itemOffset}\u0000${state.config.itemCount ?? "?"}` : null;
}

function maybeDispatchEdges(state, window) {
  const viewport = state.viewport(state.element);
  if (state.order.length === 0 || viewport.end <= 0 || viewport.start >= window.total) return;
  const checks = [
    ["start", window.visibleStart <= state.config.overscan, state.config.startBusy, "startReached"],
    ["end", window.visibleEnd >= state.order.length - state.config.overscan, state.config.endBusy, "endReached"],
  ];
  for (const [edge, reached, busy, eventName] of checks) {
    const token = edgeToken(state, edge);
    if (!reached || busy || token === null || state.lastEdgeToken[edge] === token) continue;
    state.lastEdgeToken[edge] = token;
    state.queueMicrotask(() => {
      if (!state.active || edgeToken(state, edge) !== token) return;
      const stillBusy = edge === "start" ? state.config.startBusy : state.config.endBusy;
      if (!stillBusy) state.dispatch(state.id, eventName, "");
    });
  }
}

function layout(state) {
  if (!state.active || !state.element.isConnected) return;
  const viewport = state.viewport(state.element);
  updateScrollTarget(state, viewport.eventTarget);
  applyItemMetadata(state);

  if (!state.observer) {
    attachCompleteList(state, "fallback");
    const sizes = state.order.map((id) => state.heights.get(id) ?? state.config.estimatedItemSize);
    maybeDispatchEdges(state, computeWindow({ sizes, viewportStart: viewport.start, viewportEnd: viewport.end, overscan: state.config.overscan }));
    return;
  }
  if (state.order.length <= Math.max(minimumSmallListItems, state.config.overscan * 2 + 1)) {
    attachCompleteList(state, "complete");
    const sizes = state.order.map((id) => state.heights.get(id) ?? state.config.estimatedItemSize);
    maybeDispatchEdges(state, computeWindow({ sizes, viewportStart: viewport.start, viewportEnd: viewport.end, overscan: state.config.overscan }));
    return;
  }

  const measurementsChanged = measureConnected(state);
  if (measurementsChanged) state.pendingAnchor ??= state.stableAnchor;
  const sizes = state.order.map((id) => state.heights.get(id) ?? state.config.estimatedItemSize);
  const active = state.element.ownerDocument.activeElement;
  const focusedId = active?.closest?.("li[data-luastra-id]")?.dataset?.luastraId ?? null;
  const focusedIndex = focusedId === null ? -1 : state.order.indexOf(focusedId);
  const anchorIndex = state.pendingAnchor?.map(({ id }) => state.order.indexOf(id)).find((index) => index >= 0) ?? -1;
  const window = computeWindow({
    sizes,
    viewportStart: viewport.start,
    viewportEnd: viewport.end,
    overscan: state.config.overscan,
  });
  const pinnedIndices = [focusedIndex, anchorIndex].filter((index) => index >= 0);
  const ranges = mergeRealizedRanges(window, state.order.length, pinnedIndices);
  const realized = ranges.flatMap(({ start, end }) => state.order.slice(start, end));
  while (state.middleSpacers.length < Math.max(0, ranges.length - 1)) {
    state.middleSpacers.push(makeSpacer(state.element.ownerDocument, `gap-${state.middleSpacers.length + 1}`));
  }
  state.leading.style.blockSize = `${rangeSize(sizes, 0, ranges[0]?.start ?? 0)}px`;
  state.trailing.style.blockSize = `${rangeSize(sizes, ranges.at(-1)?.end ?? 0, sizes.length)}px`;
  const desired = [state.leading];
  for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex += 1) {
    const range = ranges[rangeIndex];
    if (rangeIndex > 0) {
      const previous = ranges[rangeIndex - 1];
      const spacer = state.middleSpacers[rangeIndex - 1];
      spacer.style.blockSize = `${rangeSize(sizes, previous.end, range.start)}px`;
      desired.push(spacer);
    }
    desired.push(...state.order.slice(range.start, range.end).map((id) => state.items.get(id)).filter(Boolean));
  }
  desired.push(state.trailing);
  state.observer.disconnect();
  placeSequence(state.element, desired);
  if (focusedIndex >= 0 && active?.isConnected && state.element.ownerDocument.activeElement !== active) {
    active.focus?.({ preventScroll: true });
  }
  state.realized = realized;
  state.element.dataset.luastraListWindowState = "windowed";
  for (const id of realized) state.observer.observe(state.items.get(id));
  restoreAnchor(state);
  rememberStableAnchor(state);
  continueViewportSettlement(state);
  maybeDispatchEdges(state, window);
}

export function createWindowedListController({
  root,
  resolveNode,
  dispatch,
  viewport = findScrollViewport,
  requestFrame = (callback) => requestReliableFrame(root.ownerDocument.defaultView, callback),
  cancelFrame = (handle) => handle.cancel(),
  ResizeObserver: ResizeObserverClass = root?.ownerDocument?.defaultView?.ResizeObserver,
  queueMicrotask: enqueueMicrotask = globalThis.queueMicrotask,
} = {}) {
  if (!root?.ownerDocument) fail("windowed list root is required");
  if (typeof resolveNode !== "function") fail("windowed list node resolver is required");
  if (typeof dispatch !== "function") fail("windowed list dispatcher is required");
  if (typeof viewport !== "function" || typeof requestFrame !== "function" || typeof cancelFrame !== "function" || typeof enqueueMicrotask !== "function") fail("windowed list scheduling is invalid");
  const states = new Map();
  const view = root.ownerDocument.defaultView;

  const schedule = (state, preserveAnchor = true) => {
    if (!state.active) return;
    if (preserveAnchor) {
      state.viewportAnchor = null;
      state.viewportPasses = 0;
      state.pendingAnchor = captureAnchor(state);
    }
    if (state.frame !== null) return;
    state.frame = requestFrame(() => {
      state.frame = null;
      layout(state);
    });
  };

  const disposeState = (state) => {
    state.active = false;
    if (state.frame !== null) cancelFrame(state.frame);
    state.observer?.disconnect();
    state.scrollTarget?.removeEventListener?.("scroll", state.onScroll);
    state.leading.remove();
    state.trailing.remove();
    for (const spacer of state.middleSpacers) spacer.remove();
  };

  const makeState = (semantic) => {
    const element = resolveNode(semantic.id);
    if (!element) fail(`windowed List DOM node is unavailable: ${semantic.id}`);
    const state = {
      id: semantic.id,
      element,
      active: true,
      order: [],
      items: new Map(),
      heights: new Map(),
      realized: [],
      leading: makeSpacer(root.ownerDocument, "start"),
      trailing: makeSpacer(root.ownerDocument, "end"),
      middleSpacers: [],
      observer: null,
      scrollTarget: null,
      frame: null,
      pendingAnchor: null,
      stableAnchor: null,
      viewportAnchor: null,
      viewportPasses: 0,
      lastEdgeToken: { start: null, end: null },
      config: null,
      viewport,
      dispatch,
      queueMicrotask: (callback) => enqueueMicrotask(callback),
      onScroll: null,
      schedule: null,
    };
    state.onScroll = () => schedule(state);
    state.schedule = (preserveAnchor = true) => schedule(state, preserveAnchor);
    if (typeof ResizeObserverClass === "function") {
      state.observer = new ResizeObserverClass((entries) => {
        let changed = false;
        const anchor = state.stableAnchor ?? captureAnchor(state);
        const anchorIndex = anchor?.map(({ id }) => state.order.indexOf(id)).find((index) => index >= 0) ?? -1;
        let compensation = 0;
        for (const entry of entries) {
          const id = entry.target?.dataset?.luastraId;
          const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
          const height = borderBox?.blockSize ?? entry.contentRect?.height;
          if (!id || !finitePositive(height)) continue;
          const normalized = Math.max(1, Math.round(height * 100) / 100);
          const measuredBefore = state.heights.has(id);
          const previous = state.heights.get(id) ?? normalized;
          const itemIndex = state.order.indexOf(id);
          const itemChanged = rememberHeight(state, id, normalized);
          if (itemChanged && measuredBefore && anchorIndex >= 0 && itemIndex >= 0 && itemIndex < anchorIndex) compensation += normalized - previous;
          changed = itemChanged || changed;
        }
        if (changed) {
          if (Math.abs(compensation) >= 0.5) state.viewport(state.element).scrollBy(compensation);
          state.pendingAnchor ??= anchor;
          schedule(state, false);
        }
      });
    }
    return state;
  };

  const controller = {
    prepare() {
      for (const state of states.values()) {
        if (!state.active) continue;
        const active = state.element.ownerDocument.activeElement;
        const retainedFocus = active && state.element.contains(active) ? active : null;
        if (state.frame !== null) {
          cancelFrame(state.frame);
          state.frame = null;
        }
        state.pendingAnchor ??= captureAnchor(state);
        state.observer?.disconnect();
        placeSequence(state.element, state.order.map((id) => state.items.get(id)).filter(Boolean));
        state.realized = [...state.order];
        if (retainedFocus?.isConnected && state.element.ownerDocument.activeElement !== retainedFocus) {
          retainedFocus.focus?.({ preventScroll: true });
        }
      }
    },

    sync(tree) {
      const seen = new Set();
      for (const semantic of semanticLists(tree)) {
        seen.add(semantic.id);
        let state = states.get(semantic.id);
        if (!state) {
          state = makeState(semantic);
          states.set(semantic.id, state);
        }
        state.element = resolveNode(semantic.id);
        if (!state.element) fail(`windowed List DOM node is unavailable: ${semantic.id}`);
        state.order = semantic.children.map((child) => child.id);
        state.items = new Map(state.order.map((id) => [id, resolveNode(id)]));
        if ([...state.items.values()].some((item) => !item)) fail(`windowed List item DOM node is unavailable: ${semantic.id}`);
        for (const id of [...state.heights.keys()]) if (!state.items.has(id)) state.heights.delete(id);
        state.config = {
          estimatedItemSize: numericAttribute(semantic, "data-luastra-list-estimated-item-size"),
          overscan: numericAttribute(semantic, "data-luastra-list-overscan"),
          itemCount: numericAttribute(semantic, "data-luastra-list-item-count"),
          itemOffset: numericAttribute(semantic, "data-luastra-list-item-offset", 0),
          startBusy: semantic.attributes["data-luastra-list-start-busy"] === "true",
          endBusy: semantic.attributes["data-luastra-list-end-busy"] === "true",
          startAction: semantic.events.startReached ?? null,
          endAction: semantic.events.endReached ?? null,
        };
        layout(state);
      }
      for (const [id, state] of states) {
        if (seen.has(id)) continue;
        disposeState(state);
        states.delete(id);
      }
    },

    diagnostics() {
      return Object.freeze([...states.values()].map((state) => Object.freeze({
        id: state.id,
        mode: state.element.dataset.luastraListWindowState ?? "unknown",
        retainedItems: state.order.length,
        realizedItems: state.realized.length,
        measuredItems: state.heights.size,
      })));
    },

    dispose() {
      for (const state of states.values()) disposeState(state);
      states.clear();
      view?.removeEventListener?.("resize", controller.onViewportChange);
      view?.removeEventListener?.("orientationchange", controller.onViewportChange);
      root.ownerDocument.fonts?.removeEventListener?.("loadingdone", controller.onViewportChange);
      root.removeEventListener?.("load", controller.onContentLoad, true);
    },

    onViewportChange() {
      for (const state of states.values()) {
        state.viewportAnchor ??= state.stableAnchor ?? captureAnchor(state);
        state.viewportPasses = 2;
        state.pendingAnchor = state.viewportAnchor;
        schedule(state, false);
      }
    },

    onContentLoad(event) {
      const list = event.target?.closest?.('[data-luastra-list-mode="windowed"]');
      const id = list?.dataset?.luastraId;
      const state = id ? states.get(id) : null;
      if (!state) return;
      state.pendingAnchor = state.stableAnchor ?? captureAnchor(state);
      schedule(state, false);
    },
  };

  view?.addEventListener?.("resize", controller.onViewportChange, { passive: true });
  view?.addEventListener?.("orientationchange", controller.onViewportChange, { passive: true });
  root.ownerDocument.fonts?.addEventListener?.("loadingdone", controller.onViewportChange);
  root.addEventListener?.("load", controller.onContentLoad, true);
  return Object.freeze(controller);
}
