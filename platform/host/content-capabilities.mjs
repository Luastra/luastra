import { inspectRasterImage, rasterImageLimits } from "../content/image-admission.mjs";
import { decodeMediaWire, encodeMediaWire } from "../media/media-wire.mjs";

const previewPattern = /^preview:[A-Za-z0-9_-]{32,256}$/;
const uploadPattern = /^upload:[A-Za-z0-9_-]{32,256}$/;
const maximumSelections = 8;
const selectionTtlMs = 15 * 60 * 1000;

function response(request, status, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status, payload } };
}
function error(request, code, message) { return response(request, "error", { code, message }); }
function whole(value, minimum, maximum, label) {
  if (!/^(0|[1-9][0-9]*)$/.test(value ?? "")) throw new Error(`invalid ${label}`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw new Error(`invalid ${label}`);
  return number;
}
function opaqueToken(cryptoValue = globalThis.crypto) {
  if (typeof cryptoValue?.getRandomValues !== "function") throw new Error("secure randomness is unavailable");
  const bytes = cryptoValue.getRandomValues(new Uint8Array(32));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 6) { bits -= 6; output += alphabet[(value >>> bits) & 63]; }
  }
  if (bits > 0) output += alphabet[(value << (6 - bits)) & 63];
  return output;
}

function browserImageSelection({ request, documentTarget = globalThis.document } = {}) {
  if (!documentTarget?.createElement) throw new Error("Web file selection is unavailable");
  return new Promise((resolve, reject) => {
    const input = documentTarget.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg";
    input.multiple = false;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    Object.assign(input.style, { position: "fixed", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    let settled = false;
    const finish = (file, cause = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      input.remove();
      if (cause) reject(cause); else resolve(file ?? null);
    };
    const timer = setTimeout(() => finish(null, Object.assign(new Error("Selection timed out"), { timedOut: true })), request.deadlineMs);
    input.addEventListener("change", () => finish(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => finish(null), { once: true });
    documentTarget.body?.append(input);
    input.click();
  });
}

function browserUpload({ endpoint, file, authorizationToken, requestId, deadlineMs, onProgress, xhrFactory = () => new XMLHttpRequest() }) {
  const xhr = xhrFactory();
  const promise = new Promise((resolve, reject) => {
    xhr.open("PUT", endpoint);
    xhr.responseType = "text";
    xhr.timeout = deadlineMs;
    xhr.setRequestHeader("Content-Type", file.type);
    const token = authorizationToken();
    if (typeof token === "string" && token !== "") xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload?.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(requestId, event.loaded, event.total);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) resolve(xhr.responseText);
      else reject(Object.assign(new Error("Upload was rejected"), { status: xhr.status }));
    }, { once: true });
    xhr.addEventListener("error", () => reject(new Error("Upload transport failed")), { once: true });
    xhr.addEventListener("timeout", () => reject(Object.assign(new Error("Upload timed out"), { timedOut: true })), { once: true });
    xhr.addEventListener("abort", () => reject(Object.assign(new Error("Upload cancelled"), { cancelled: true })), { once: true });
    xhr.send(file);
  });
  return Object.assign(promise, { xhr });
}

export function createContentCapabilities({
  selectImage = browserImageSelection,
  inspectImage = inspectRasterImage,
  decodeImage = async (file) => {
    if (typeof globalThis.createImageBitmap !== "function") return null;
    const bitmap = await globalThis.createImageBitmap(file);
    try { return { width: bitmap.width, height: bitmap.height }; }
    finally { bitmap.close?.(); }
  },
  uploadFile = browserUpload,
  createObjectUrl = (file) => URL.createObjectURL(file),
  revokeObjectUrl = (url) => URL.revokeObjectURL(url),
  authorizationToken = () => "",
  webSelection = globalThis.Capacitor?.isNativePlatform?.() !== true && !globalThis.__TAURI_INTERNALS__,
  now = () => Date.now(),
  randomToken = opaqueToken,
} = {}) {
  if ([selectImage, inspectImage, decodeImage, uploadFile, createObjectUrl, revokeObjectUrl, authorizationToken, now, randomToken].some((item) => typeof item !== "function")) throw new Error("invalid content capability dependencies");
  const selections = new Map();
  const activeUploads = new Map();
  const listeners = new Set();
  const lastProgressAt = new Map();
  let disposed = false;
  const prune = () => {
    const current = now();
    for (const [handle, selection] of selections) {
      if (selection.expiresAt > current) continue;
      if (selection.url) revokeObjectUrl(selection.url);
      selections.delete(handle);
    }
    while (selections.size >= maximumSelections) {
      const [handle, selection] = selections.entries().next().value;
      if (selection.url) revokeObjectUrl(selection.url);
      selections.delete(handle);
    }
  };
  const progress = (requestId, loaded, total) => {
    if (!Number.isSafeInteger(loaded) || !Number.isSafeInteger(total) || loaded < 0 || total < 1 || loaded > total) return;
    const current = now();
    if (loaded < total && current - (lastProgressAt.get(requestId) ?? Number.NEGATIVE_INFINITY) < 250) return;
    lastProgressAt.set(requestId, current);
    const payload = encodeMediaWire({ loaded: String(loaded), requestId: String(requestId), total: String(total) });
    for (const listener of listeners) listener(payload);
  };
  const pick = async (request) => {
    const fields = decodeMediaWire(request.payload.input);
    const expected = ["maximumBytes", "maximumHeight", "maximumWidth", "source"];
    if (Object.keys(fields).sort().join("\n") !== expected.join("\n") || fields.source !== "files") throw new Error("unsupported image selection policy");
    const limits = {
      maximumBytes: whole(fields.maximumBytes, 4, rasterImageLimits.maximumBytes, "maximum bytes"),
      maximumWidth: whole(fields.maximumWidth, 1, rasterImageLimits.maximumWidth, "maximum width"),
      maximumHeight: whole(fields.maximumHeight, 1, rasterImageLimits.maximumHeight, "maximum height"),
    };
    const file = await selectImage({ request, limits });
    if (file === null) return response(request, "ok", encodeMediaWire({ status: "cancelled" }));
    if (!(file instanceof Blob) || typeof file.type !== "string") throw new Error("picker returned an invalid file");
    const metadata = inspectImage(await file.arrayBuffer(), { ...limits, declaredMediaType: file.type });
    const decoded = await decodeImage(file);
    if (decoded && (decoded.width !== metadata.width || decoded.height !== metadata.height)) throw new Error("decoded image metadata is inconsistent");
    prune();
    const handle = `preview:${randomToken()}`;
    if (!previewPattern.test(handle) || selections.has(handle)) throw new Error("picker generated an invalid preview handle");
    selections.set(handle, { file, metadata, expiresAt: now() + selectionTtlMs, url: null });
    return response(request, "ok", encodeMediaWire({
      bytes: String(metadata.bytes), handle, height: String(metadata.height), mediaType: metadata.mediaType,
      orientation: metadata.orientation, status: "selected", width: String(metadata.width),
    }));
  };
  const release = (request) => {
    const fields = decodeMediaWire(request.payload.input);
    if (Object.keys(fields).join("\n") !== "handle" || !previewPattern.test(fields.handle ?? "")) throw new Error("invalid preview release");
    const selection = selections.get(fields.handle);
    if (selection?.url) revokeObjectUrl(selection.url);
    selections.delete(fields.handle);
    return response(request, "ok", encodeMediaWire({ status: selection ? "released" : "missing" }));
  };
  const upload = async (request) => {
    const fields = decodeMediaWire(request.payload.input);
    if (Object.keys(fields).sort().join("\n") !== "intent\nselection" || !previewPattern.test(fields.selection ?? "") || !uploadPattern.test(fields.intent ?? "")) throw new Error("invalid upload request");
    prune();
    const selection = selections.get(fields.selection);
    if (!selection) throw new Error("preview selection is unavailable");
    let transport;
    try {
      transport = uploadFile({
        endpoint: `/__luastra/upload/${fields.intent.slice("upload:".length)}`,
        file: selection.file,
        authorizationToken,
        requestId: request.requestId,
        deadlineMs: request.deadlineMs,
        onProgress: progress,
      });
      if (transport?.xhr) activeUploads.set(request.requestId, transport.xhr);
      const payload = await transport;
      return response(request, "ok", payload || encodeMediaWire({ status: "uploaded" }));
    } catch (cause) {
      if (cause?.timedOut) return error(request, "DEADLINE", "Upload deadline exceeded");
      if (cause?.cancelled) return error(request, "CANCELLED", "Upload cancelled");
      return error(request, Number(cause?.status) === 401 ? "UNAUTHORIZED" : Number(cause?.status) >= 500 ? "NETWORK" : "VALIDATION", "Upload was rejected");
    } finally { activeUploads.delete(request.requestId); lastProgressAt.delete(request.requestId); }
  };
  const cancel = (request) => {
    const fields = decodeMediaWire(request.payload.input);
    const requestId = whole(fields.requestId, 1, Number.MAX_SAFE_INTEGER, "upload request ID");
    if (Object.keys(fields).join("\n") !== "requestId") throw new Error("invalid upload cancellation");
    const xhr = activeUploads.get(requestId);
    if (xhr) xhr.abort();
    return response(request, "ok", encodeMediaWire({ status: xhr ? "cancelled" : "missing" }));
  };
  const handle = async (request) => {
    if (disposed) return error(request, "CANCELLED", "Content adapter is disposed");
    if (!request || typeof request !== "object" || typeof request.payload?.operation !== "string" || typeof request.payload?.input !== "string") return error(request, "VALIDATION", "Malformed content capability request");
    try {
      if (webSelection !== true) return error(request, "FORBIDDEN", "Content selection and upload are unsupported in this host");
      if (request.kind === "content.pick" && request.payload.operation === "image") return await pick(request);
      if (request.kind === "content.pick" && request.payload.operation === "release") return release(request);
      if (request.kind === "content.upload" && request.payload.operation === "start") return await upload(request);
      if (request.kind === "content.upload" && request.payload.operation === "cancel") return cancel(request);
      return error(request, "FORBIDDEN", "Content capability is unavailable");
    } catch (cause) {
      if (cause?.timedOut) return error(request, "DEADLINE", "Content operation deadline exceeded");
      return error(request, "VALIDATION", "Content operation was rejected");
    }
  };
  const resolvePreview = (handle) => {
    if (!previewPattern.test(handle ?? "")) return null;
    prune();
    const selection = selections.get(handle);
    if (!selection) return null;
    if (!selection.url) selection.url = createObjectUrl(selection.file);
    let released = false;
    return { url: selection.url, release() {
      if (released) return;
      released = true;
      if (selection.url) { revokeObjectUrl(selection.url); selection.url = null; }
    } };
  };
  const subscribe = (listener) => { if (typeof listener !== "function") throw new Error("content listener must be a function"); listeners.add(listener); return () => listeners.delete(listener); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const xhr of activeUploads.values()) xhr.abort();
    activeUploads.clear();
    lastProgressAt.clear();
    for (const selection of selections.values()) if (selection.url) revokeObjectUrl(selection.url);
    selections.clear();
    listeners.clear();
  };
  return Object.freeze({ handle, resolvePreview, subscribe, dispose, get selectionCount() { prune(); return selections.size; }, get activeUploads() { return activeUploads.size; } });
}

export const contentCapabilityLimits = Object.freeze({ maximumSelections, selectionTtlMs, mediaTypes: rasterImageLimits.mediaTypes });
