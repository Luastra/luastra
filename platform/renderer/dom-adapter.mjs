import { validateRendererPatch } from "../protocol/generated/protocol.mjs";

const dynamicStyleAttributes = Object.freeze({
  "data-luastra-width": ["--luastra-frame-width", (value) => `${value}px`],
  "data-luastra-height": ["--luastra-frame-height", (value) => `${value}px`],
  "data-luastra-aspect-ratio": ["--luastra-frame-aspect-ratio", (value) => value],
  "data-luastra-corner-radius": ["--luastra-corner-radius", (value) => `${value}px`],
  "data-luastra-stroke-width": ["--luastra-shape-stroke-width", (value) => `${value}px`],
  "data-luastra-fill": ["--luastra-shape-fill", colorValue],
  "data-luastra-stroke": ["--luastra-shape-stroke", colorValue],
  "data-luastra-text-color": ["--luastra-local-text-color", colorValue],
  "data-luastra-background-color": ["--luastra-local-background-color", colorValue],
  "data-luastra-theme-background": ["--luastra-color-bg", (value) => value],
  "data-luastra-theme-text": ["--luastra-color-text", (value) => value],
  "data-luastra-theme-accent": [["--luastra-color-accent", "--luastra-color-accent-text", "--luastra-color-accent-strong"], (value) => value],
  "data-luastra-theme-danger": ["--luastra-color-danger", (value) => value],
  "data-luastra-theme-muted": ["--luastra-color-muted", (value) => value],
  "data-luastra-theme-surface": [["--luastra-color-surface", "--luastra-color-surface-raised"], (value) => value],
  "data-luastra-theme-success": ["--luastra-color-success", (value) => value],
  "data-luastra-theme-warning": ["--luastra-color-highlight", (value) => value],
});
const colorTokens = Object.freeze({
  accent: "var(--luastra-color-accent)", danger: "var(--luastra-color-danger)", muted: "var(--luastra-color-muted)",
  surface: "var(--luastra-color-surface)", success: "var(--luastra-color-success)", text: "var(--luastra-color-text)",
  transparent: "transparent", warning: "var(--luastra-color-highlight)",
});

function colorValue(value) { return colorTokens[value] ?? value; }

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(left, right) {
  const values = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function onAccentColor(accent) {
  const dark = "#071815";
  const light = "#FFFFFF";
  return contrastRatio(light, accent) >= contrastRatio(dark, accent) ? light : dark;
}

function fail(message) {
  throw new Error(message);
}

export class DomAdapter {
  #document;
  #nodes = new Map();
  #listeners = new Map();
  #composing = new WeakSet();
  #enterKeyListeners = new WeakMap();
  #modalState = new WeakMap();
  #modalOrigins = new WeakMap();
  #dispatch;
  #initialMetadata;

  constructor(root, { dispatch = null } = {}) {
    if (!root?.ownerDocument) fail("DOM root is required");
    this.#document = root.ownerDocument;
    this.#initialMetadata = {
      title: this.#document.title ?? "",
      language: this.#document.documentElement?.lang ?? "",
      description: this.#document.querySelector?.('meta[name="description"]')?.getAttribute("content") ?? "",
    };
    if (dispatch !== null && typeof dispatch !== "function") fail("DOM event dispatch must be a function");
    this.#dispatch = dispatch;
    this.#nodes.set("host-root", root);
  }

  node(id) {
    return this.#nodes.get(id) ?? null;
  }

  applyBatch(patches) {
    if (!Array.isArray(patches) || !patches.every(validateRendererPatch)) {
      fail("DOM batch validation failed");
    }
    this.#preflight(patches);
    for (const patch of patches) this.#apply(patch);
  }

  #preflight(patches) {
    const elementIds = new Map([...this.#nodes].map(([id, element]) => [element, id]));
    const graph = new Map();
    for (const [id, element] of this.#nodes) {
      const parent = element.parentElement ? elementIds.get(element.parentElement) ?? null : null;
      graph.set(id, { parent, children: [] });
    }
    for (const [id, node] of graph) {
      if (node.parent) graph.get(node.parent)?.children.push(id);
    }

    const removeTree = (id) => {
      const node = graph.get(id);
      for (const child of [...node.children]) removeTree(child);
      if (node.parent) {
        const siblings = graph.get(node.parent).children;
        siblings.splice(siblings.indexOf(id), 1);
      }
      graph.delete(id);
    };

    for (const patch of patches) {
      if (patch.kind === "create") {
        if (graph.has(patch.target)) fail(`duplicate DOM node: ${patch.target}`);
        graph.set(patch.target, { parent: null, children: [] });
        continue;
      }

      const target = graph.get(patch.target);
      if (!target) fail(`unknown DOM target: ${patch.target}`);
      if (patch.kind === "remove") {
        if (patch.target === "host-root") fail("cannot remove DOM host root");
        removeTree(patch.target);
        continue;
      }
      if (patch.kind !== "append" && patch.kind !== "place") continue;

      const childId = patch.kind === "append" ? patch.value : patch.name;
      const beforeId = patch.kind === "place" ? patch.value : "";
      const child = graph.get(childId);
      if (!child) fail(`unknown DOM child: ${childId}`);
      if (childId === "host-root") fail("cannot place DOM host root");
      if (beforeId !== "") {
        const before = graph.get(beforeId);
        if (!before || before.parent !== patch.target) fail(`unknown DOM before node: ${beforeId}`);
      }
      for (let ancestor = patch.target; ancestor; ancestor = graph.get(ancestor)?.parent ?? null) {
        if (ancestor === childId) fail("DOM placement cycle");
      }
      if (child.parent) {
        const previousChildren = graph.get(child.parent).children;
        previousChildren.splice(previousChildren.indexOf(childId), 1);
      }
      const insertionIndex = beforeId === "" ? target.children.length : target.children.indexOf(beforeId);
      target.children.splice(insertionIndex, 0, childId);
      child.parent = patch.target;
    }
  }

  #apply(patch) {
    if (patch.kind === "create") {
      if (this.#nodes.has(patch.target)) fail(`duplicate DOM node: ${patch.target}`);
      const element = this.#document.createElement(patch.value);
      element.id = patch.target;
      element.dataset.luastraId = patch.target;
      this.#nodes.set(patch.target, element);
      return;
    }
    const target = this.#nodes.get(patch.target);
    if (!target) fail(`unknown DOM target: ${patch.target}`);
    if (patch.kind === "text") target.textContent = patch.value;
    else if (patch.kind === "attribute") this.#setAttribute(target, patch.name, patch.value);
    else if (patch.kind === "remove-attribute") this.#removeAttribute(target, patch.name);
    else if (patch.kind === "event") this.#setEvent(target, patch.target, patch.name, patch.value);
    else if (patch.kind === "place") {
      const child = this.#nodes.get(patch.name);
      const before = patch.value === "" ? null : this.#nodes.get(patch.value);
      if (!child || (patch.value !== "" && !before)) fail("unknown DOM placement node");
      target.insertBefore(child, before);
      this.#activatePendingModals(child);
    } else if (patch.kind === "append") {
      const child = this.#nodes.get(patch.value);
      if (!child) fail(`unknown DOM child: ${patch.value}`);
      target.append(child);
      this.#activatePendingModals(child);
    } else if (patch.kind === "remove") {
      this.#drop(target);
      target.remove();
    } else if (patch.kind === "focus") target.focus({ preventScroll: true });
    else if (patch.kind === "modal") this.#setModal(target, patch.value);
  }

  #setModal(target, state) {
    this.#modalState.set(target, state);
    if (state === "open") {
      if (!this.#modalOrigins.has(target)) this.#modalOrigins.set(target, this.#document.activeElement ?? null);
      this.#openModal(target);
      return;
    }
    if (typeof target.close === "function" && target.open) target.close();
    else target.removeAttribute("open");
    const origin = this.#modalOrigins.get(target);
    this.#modalOrigins.delete(target);
    if (origin && origin !== target && origin.isConnected !== false && typeof origin.focus === "function") {
      origin.focus({ preventScroll: true });
    }
  }

  #openModal(target) {
    if (typeof target.showModal !== "function") {
      target.setAttribute("open", "");
      return;
    }
    if (target.open) return;
    try {
      target.showModal();
    } catch (error) {
      if (error?.name !== "InvalidStateError") throw error;
    }
  }

  #activatePendingModals(node) {
    const candidates = [node, ...[...(node.querySelectorAll?.("dialog[data-luastra-id]") ?? [])]];
    for (const candidate of candidates) {
      if (this.#modalState.get(candidate) === "open") this.#openModal(candidate);
    }
  }

  #setAttribute(target, name, value) {
    if (name.startsWith("data-luastra-document-")) {
      this.#setDocumentMetadata(name, value);
      target.setAttribute(name, value);
      return;
    }
    if (dynamicStyleAttributes[name]) {
      const [propertyValue, format] = dynamicStyleAttributes[name];
      const properties = Array.isArray(propertyValue) ? propertyValue : [propertyValue];
      for (const property of properties) target.style.setProperty(property, format(value));
      if (name === "data-luastra-theme-accent") target.style.setProperty("--luastra-color-on-accent", onAccentColor(value));
      target.setAttribute(name, value);
      return;
    }
    if (name === "value" && "value" in target) {
      const active = this.#document.activeElement === target;
      if (active && this.#composing.has(target)) {
        target.setAttribute(name, value);
        return;
      }
      const selection = active && typeof target.selectionStart === "number"
        ? [target.selectionStart, target.selectionEnd, target.selectionDirection]
        : null;
      target.value = value;
      target.setAttribute(name, value);
      if (selection) {
        const start = Math.min(selection[0], value.length);
        const end = Math.min(selection[1], value.length);
        target.setSelectionRange(start, end, selection[2] ?? "none");
      }
      return;
    }
    if (name === "enterkeyhint") {
      this.#setEnterKeyHint(target, value);
      return;
    }
    if (["disabled", "hidden", "required"].includes(name)) {
      const enabled = value === "true";
      target.toggleAttribute(name, enabled);
      target[name] = enabled;
      return;
    }
    target.setAttribute(name, value);
  }

  #setEnterKeyHint(target, value) {
    this.#removeEnterKeyListener(target);
    target.setAttribute("enterkeyhint", value);
    if (value !== "done" && value !== "next") return;

    const listener = (event) => {
      if (event.key !== "Enter" || event.isComposing === true || event.keyCode === 229 || this.#composing.has(target)) return;
      if (value === "next") {
        const next = this.#nextEditable(target);
        if (!next) return;
        event.preventDefault();
        next.focus({ preventScroll: true });
        return;
      }
      event.preventDefault();
      target.blur();
    };
    target.addEventListener("keydown", listener);
    this.#enterKeyListeners.set(target, listener);
  }

  #nextEditable(target) {
    const candidates = [...this.#document.querySelectorAll('input, textarea, select, [contenteditable="true"]')]
      .filter((candidate) => {
        if (candidate.disabled || candidate.hidden || candidate.tabIndex < 0) return false;
        if ((candidate.getAttribute?.("type") ?? "").toLowerCase() === "hidden") return false;
        if (candidate.getAttribute?.("aria-hidden") === "true") return false;
        if (candidate.closest?.("[hidden], [inert], dialog:not([open])")) return false;
        return true;
      });
    const current = candidates.indexOf(target);
    return current < 0 ? null : candidates[current + 1] ?? null;
  }

  #removeAttribute(target, name) {
    if (name === "enterkeyhint") this.#removeEnterKeyListener(target);
    if (dynamicStyleAttributes[name]) {
      const propertyValue = dynamicStyleAttributes[name][0];
      const properties = Array.isArray(propertyValue) ? propertyValue : [propertyValue];
      for (const property of properties) target.style.removeProperty(property);
      if (name === "data-luastra-theme-accent") target.style.removeProperty("--luastra-color-on-accent");
    }
    if (name.startsWith("data-luastra-document-")) this.#restoreDocumentMetadata(name);
    target.removeAttribute(name);
  }

  #setDocumentMetadata(name, value) {
    if (name === "data-luastra-document-title") this.#document.title = value;
    else if (name === "data-luastra-document-language" && this.#document.documentElement) this.#document.documentElement.lang = value;
    else if (name === "data-luastra-document-description") {
      let metadata = this.#document.querySelector?.('meta[name="description"]') ?? null;
      if (!metadata && this.#document.createElement && this.#document.head?.append) {
        metadata = this.#document.createElement("meta");
        metadata.setAttribute("name", "description");
        this.#document.head.append(metadata);
      }
      metadata?.setAttribute("content", value);
    }
  }

  #restoreDocumentMetadata(name) {
    if (name === "data-luastra-document-title") this.#document.title = this.#initialMetadata.title;
    else if (name === "data-luastra-document-language" && this.#document.documentElement) this.#document.documentElement.lang = this.#initialMetadata.language;
    else if (name === "data-luastra-document-description") {
      this.#document.querySelector?.('meta[name="description"]')?.setAttribute("content", this.#initialMetadata.description);
    }
  }

  #removeEnterKeyListener(target) {
    const previous = this.#enterKeyListeners.get(target);
    if (!previous) return;
    target.removeEventListener("keydown", previous);
    this.#enterKeyListeners.delete(target);
  }

  #setEvent(target, targetId, eventName, action) {
    const nativeEvents = eventName === "input" ? ["input", "compositionstart", "compositionend"]
      : eventName === "dismiss" ? ["cancel"] : [eventName];
    for (const nativeEvent of nativeEvents) {
      const key = `${targetId}:${nativeEvent}`;
      const previous = this.#listeners.get(key);
      if (previous) target.removeEventListener(nativeEvent, previous);
      this.#listeners.delete(key);
    }
    if (action === "") return;
    if (!this.#dispatch) fail("DOM event dispatch is unavailable");
    const listener = (event) => {
      if (eventName === "input" && (event.isComposing === true || this.#composing.has(event.currentTarget))) return;
      if (eventName === "dismiss") event.preventDefault();
      const value = "value" in event.currentTarget ? String(event.currentTarget.value) : "";
      this.#dispatch({ action, target: targetId, value, nativeEvent: event });
    };
    const dispatchedEvent = eventName === "dismiss" ? "cancel" : eventName;
    target.addEventListener(dispatchedEvent, listener);
    this.#listeners.set(`${targetId}:${dispatchedEvent}`, listener);
    if (eventName === "input") {
      const compositionStart = (event) => this.#composing.add(event.currentTarget);
      const compositionEnd = (event) => this.#composing.delete(event.currentTarget);
      target.addEventListener("compositionstart", compositionStart);
      target.addEventListener("compositionend", compositionEnd);
      this.#listeners.set(`${targetId}:compositionstart`, compositionStart);
      this.#listeners.set(`${targetId}:compositionend`, compositionEnd);
    }
  }

  #drop(node) {
    const descendants = [...(node.querySelectorAll?.("[data-luastra-id]") ?? [])];
    for (const descendant of descendants) {
      this.#nodes.delete(descendant.dataset.luastraId);
    }
    if (node.dataset?.luastraId) this.#nodes.delete(node.dataset.luastraId);
    const removedIds = [node.dataset?.luastraId, ...descendants.map((item) => item.dataset.luastraId)].filter(Boolean);
    for (const key of [...this.#listeners.keys()]) {
      if (removedIds.some((id) => key.startsWith(`${id}:`))) this.#listeners.delete(key);
    }
    for (const removed of [node, ...descendants]) {
      this.#removeEnterKeyListener(removed);
    }
  }
}
