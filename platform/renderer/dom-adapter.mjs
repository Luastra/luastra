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
const buttonIconPaths = Object.freeze({
  activity: ["M3 12h4l2.5-7 5 14 2.5-7h4"],
  "arrow-left": ["M19 12H5", "M12 19l-7-7 7-7"],
  check: ["m5 12 4 4L19 6"],
  close: ["M6 6l12 12M18 6 6 18"],
  home: ["m3 11 9-8 9 8", "M5 10v10h14V10", "M9 20v-6h6v6"],
  list: ["M8 6h13M8 12h13M8 18h13", "M3 6h.01M3 12h.01M3 18h.01"],
  palette: ["M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18A3 3 0 0 0 21 12a9 9 0 0 0-9-9Z", "M7.5 10h.01M9.5 6.5h.01M14.5 6.5h.01M17 10h.01"],
  pause: ["M9 5v14M15 5v14"],
  plus: ["M12 5v14M5 12h14"],
  retry: ["M20 11a8 8 0 1 0-2.34 5.66", "M20 4v7h-7"],
  search: ["m21 21-4.35-4.35", "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"],
  settings: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2 3.46-.08-.02a1.7 1.7 0 0 0-1.8-.65l-.04.02a1.7 1.7 0 0 0-1.15 1.5V21h-4v-.09a1.7 1.7 0 0 0-1.15-1.5l-.04-.02a1.7 1.7 0 0 0-1.8.65l-.08.02-2-3.46.06-.06A1.7 1.7 0 0 0 6 14.66v-.05a1.7 1.7 0 0 0-1.42-1.12H4.5v-4h.08A1.7 1.7 0 0 0 6 8.37v-.05a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2-3.46.08.02a1.7 1.7 0 0 0 1.8.65l.04-.02a1.7 1.7 0 0 0 1.15-1.5V2h4v.09a1.7 1.7 0 0 0 1.15 1.5l.04.02a1.7 1.7 0 0 0 1.8-.65l.08-.02 2 3.46-.06.06A1.7 1.7 0 0 0 19.4 8.34v.05a1.7 1.7 0 0 0 1.42 1.12h.08v4h-.08a1.7 1.7 0 0 0-1.42 1.12Z"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"],
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

// Shared by the DOM host and build-time HTML export; never accept raw CSS.
export function rendererStyleDeclarations(name, value) {
  if (!dynamicStyleAttributes[name]) return [];
  const [propertyValue, format] = dynamicStyleAttributes[name];
  const properties = Array.isArray(propertyValue) ? propertyValue : [propertyValue];
  const declarations = properties.map(property => [property, format(value)]);
  if (name === "data-luastra-theme-accent") declarations.push(["--luastra-color-on-accent", onAccentColor(value)]);
  return declarations;
}

export class DomAdapter {
  #document;
  #nodes = new Map();
  #listeners = new Map();
  #hostEvents = new Map();
  #composing = new WeakSet();
  #enterKeyListeners = new WeakMap();
  #modalState = new WeakMap();
  #modalOrigins = new WeakMap();
  #pendingModalClosures = new WeakMap();
  #dispatch;
  #deferModalClose;
  #initialMetadata;
  #retainResource;
  #releaseResource;

  constructor(root, { dispatch = null, deferModalClose = null, retainResource = null, releaseResource = null } = {}) {
    if (!root?.ownerDocument) fail("DOM root is required");
    this.#document = root.ownerDocument;
    this.#initialMetadata = {
      title: this.#document.title ?? "",
      language: this.#document.documentElement?.lang ?? "",
      description: this.#document.querySelector?.('meta[name="description"]')?.getAttribute("content") ?? "",
    };
    if (dispatch !== null && typeof dispatch !== "function") fail("DOM event dispatch must be a function");
    if (deferModalClose !== null && typeof deferModalClose !== "function") fail("Deferred modal close handler must be a function");
    if (retainResource !== null && typeof retainResource !== "function") fail("Resource retain handler must be a function");
    if (releaseResource !== null && typeof releaseResource !== "function") fail("Resource release handler must be a function");
    this.#dispatch = dispatch;
    this.#deferModalClose = deferModalClose;
    this.#retainResource = retainResource;
    this.#releaseResource = releaseResource;
    this.#nodes.set("host-root", root);
  }

  node(id) {
    return this.#nodes.get(id) ?? null;
  }

  dispatchHostEvent(targetId, eventName, value = "") {
    if (!new Set(["startReached", "endReached"]).has(eventName)) fail("unsupported host event");
    if (typeof value !== "string" || new TextEncoder().encode(value).byteLength > 4096) fail("host event value is invalid");
    const action = this.#hostEvents.get(`${targetId}:${eventName}`);
    if (!action) return false;
    if (!this.#dispatch) fail("DOM event dispatch is unavailable");
    this.#dispatch({ action, target: targetId, value, nativeEvent: null });
    return true;
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
    if (patch.kind === "text") {
      target.textContent = patch.value;
      this.#syncButtonIcon(target);
    }
    else if (patch.kind === "attribute") this.#setAttribute(target, patch.name, patch.value);
    else if (patch.kind === "remove-attribute") this.#removeAttribute(target, patch.name);
    else if (patch.kind === "event") this.#setEvent(target, patch.target, patch.name, patch.value);
    else if (patch.kind === "place") {
      const child = this.#nodes.get(patch.name);
      const before = patch.value === "" ? null : this.#nodes.get(patch.value);
      if (!child || (patch.value !== "" && !before)) fail("unknown DOM placement node");
      target.insertBefore(child, before);
      this.#activatePendingModals(child);
      if (this.#modalState.get(target) === "open") this.#focusModalInitial(target);
    } else if (patch.kind === "append") {
      const child = this.#nodes.get(patch.value);
      if (!child) fail(`unknown DOM child: ${patch.value}`);
      target.append(child);
      this.#activatePendingModals(child);
      if (this.#modalState.get(target) === "open") this.#focusModalInitial(target);
    } else if (patch.kind === "remove") {
      this.#drop(target);
      target.remove();
    } else if (patch.kind === "focus") target.focus({ preventScroll: true });
    else if (patch.kind === "modal") this.#setModal(target, patch.value);
  }

  #setModal(target, state) {
    this.#modalState.set(target, state);
    if (state === "open") {
      const pending = this.#pendingModalClosures.get(target);
      if (pending) {
        this.#pendingModalClosures.delete(target);
        pending.cancel?.();
      }
      if (!this.#modalOrigins.has(target)) this.#modalOrigins.set(target, this.#document.activeElement ?? null);
      this.#openModal(target);
      return;
    }
    if (target.open && this.#deferModalClose) {
      const pending = {};
      this.#pendingModalClosures.set(target, pending);
      const complete = () => {
        if (this.#pendingModalClosures.get(target) !== pending || this.#modalState.get(target) !== "closed") return false;
        this.#pendingModalClosures.delete(target);
        this.#finishModalClose(target);
        return true;
      };
      const cancellation = this.#deferModalClose(target, complete);
      if (cancellation !== false) {
        pending.cancel = typeof cancellation === "function" ? cancellation : null;
        return;
      }
      if (this.#pendingModalClosures.get(target) === pending) this.#pendingModalClosures.delete(target);
    }
    this.#finishModalClose(target);
  }

  #finishModalClose(target) {
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
    } else if (!target.open) {
      try {
        target.showModal();
      } catch (error) {
        if (error?.name !== "InvalidStateError") throw error;
      }
    }
    this.#focusModalInitial(target);
  }

  #focusModalInitial(target) {
    const initialFocus = target.getAttribute?.("data-luastra-initial-focus");
    if (initialFocus) {
      const candidate = [...(target.querySelectorAll?.("[data-luastra-id]") ?? [])].find((item) => item.dataset?.luastraId === initialFocus);
      if (candidate && typeof candidate.focus === "function") candidate.focus({ preventScroll: true });
    }
  }

  #activatePendingModals(node) {
    const candidates = [node, ...[...(node.querySelectorAll?.("dialog[data-luastra-id]") ?? [])]];
    for (const candidate of candidates) {
      if (this.#modalState.get(candidate) === "open") this.#openModal(candidate);
    }
  }

  #setAttribute(target, name, value) {
    if (name === "src" || name === "data-luastra-image-placeholder-src") {
      const previous = target.getAttribute?.(name);
      if (previous === value) return;
      if (previous) this.#releaseResource?.(previous);
      this.#retainResource?.(value);
      target.setAttribute(name, value);
      if (name === "data-luastra-image-placeholder-src" && target.style) target.style.backgroundImage = `url(${JSON.stringify(value)})`;
      return;
    }
    if (name === "data-luastra-image-placeholder-color") {
      target.setAttribute(name, value);
      if (target.style) target.style.backgroundColor = value;
      return;
    }
    if (name === "data-luastra-icon") {
      target.setAttribute(name, value);
      this.#syncButtonIcon(target);
      return;
    }
    if (name.startsWith("data-luastra-document-")) {
      this.#setDocumentMetadata(name, value);
      target.setAttribute(name, value);
      return;
    }
    if (dynamicStyleAttributes[name]) {
      for (const [property, formatted] of rendererStyleDeclarations(name, value)) target.style.setProperty(property, formatted);
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
    if (name === "src" || name === "data-luastra-image-placeholder-src") {
      const previous = target.getAttribute?.(name);
      if (previous) this.#releaseResource?.(previous);
      if (name === "data-luastra-image-placeholder-src" && target.style) target.style.backgroundImage = "";
    }
    if (name === "data-luastra-image-placeholder-color" && target.style) target.style.backgroundColor = "";
    if (name === "data-luastra-icon") target.querySelector?.(":scope > .luastra-icon-glyph")?.remove();
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

  #syncButtonIcon(target) {
    const iconName = target.dataset?.luastraIcon ?? "";
    const paths = buttonIconPaths[iconName];
    const previous = target.querySelector?.(":scope > .luastra-icon-glyph");
    if (!paths) {
      previous?.remove();
      return;
    }
    if (previous?.dataset?.icon === iconName) return;
    previous?.remove();
    const icon = this.#document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("luastra-icon-glyph", "luastra-button-icon");
    icon.dataset.icon = iconName;
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", iconName === "pause" ? "2.5" : "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    for (const pathData of paths) {
      const path = this.#document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.append(path);
    }
    target.prepend(icon);
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
    if (eventName === "startReached" || eventName === "endReached") {
      const key = `${targetId}:${eventName}`;
      this.#hostEvents.delete(key);
      if (action !== "") this.#hostEvents.set(key, action);
      return;
    }
    const nativeEvents = eventName === "input" ? ["input", "compositionstart", "compositionend"]
      : eventName === "submit" ? ["keydown"]
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
      if (eventName === "submit") {
        if (event.key !== "Enter" || event.shiftKey === true || event.isComposing === true || event.keyCode === 229 || this.#composing.has(event.currentTarget)) return;
        event.preventDefault();
      }
      if (eventName === "load" && event.currentTarget?.tagName?.toLowerCase() === "img") {
        const expectedWidth = Number(event.currentTarget.getAttribute?.("data-luastra-image-pixel-width"));
        const expectedHeight = Number(event.currentTarget.getAttribute?.("data-luastra-image-pixel-height"));
        const actualWidth = Number(event.currentTarget.naturalWidth);
        const actualHeight = Number(event.currentTarget.naturalHeight);
        if (Number.isSafeInteger(expectedWidth) && expectedWidth > 0 && Number.isSafeInteger(expectedHeight) && expectedHeight > 0 &&
            Number.isSafeInteger(actualWidth) && actualWidth > 0 && Number.isSafeInteger(actualHeight) && actualHeight > 0 &&
            (actualWidth !== expectedWidth || actualHeight !== expectedHeight)) {
          this.#listeners.get(`${targetId}:error`)?.({ currentTarget: event.currentTarget, nativeEvent: event });
          return;
        }
      }
      if (eventName === "dismiss") event.preventDefault();
      if (eventName === "click" && event.currentTarget?.tagName?.toLowerCase() === "a") {
        const modified = event.metaKey === true || event.ctrlKey === true || event.shiftKey === true || event.altKey === true;
        const nonPrimary = event.button !== undefined && event.button !== 0;
        if (modified || nonPrimary) return;
        event.preventDefault();
      }
      const value = "value" in event.currentTarget ? String(event.currentTarget.value) : "";
      this.#dispatch({ action, target: targetId, value, nativeEvent: event });
    };
    const dispatchedEvent = eventName === "dismiss" ? "cancel" : eventName === "submit" ? "keydown" : eventName;
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
    for (const key of [...this.#hostEvents.keys()]) {
      if (removedIds.some((id) => key.startsWith(`${id}:`))) this.#hostEvents.delete(key);
    }
    for (const removed of [node, ...descendants]) {
      for (const name of ["src", "data-luastra-image-placeholder-src"]) {
        const resource = removed.getAttribute?.(name);
        if (resource) this.#releaseResource?.(resource);
      }
      const pending = this.#pendingModalClosures.get(removed);
      if (pending) {
        this.#pendingModalClosures.delete(removed);
        pending.cancel?.();
      }
      this.#removeEnterKeyListener(removed);
    }
  }
}
