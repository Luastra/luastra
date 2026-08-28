import createLuastraVm from "/platform/artifacts/vm-wasm/luastra-vm.js";
import {
  Protocol,
  validateCapabilityRequest,
  validateCapabilityResponse,
  rendererTreeError,
  validateRpcResponse,
} from "/platform/protocol/generated/protocol.mjs?contract=1-server-call-media-command";
import { RequestLedger } from "/platform/protocol/request-ledger.mjs";
import { materializeRendererTree } from "/platform/renderer/from-protocol-tree.mjs";
import { reconcile } from "/platform/renderer/reconciler.mjs";
import { DomAdapter } from "/platform/renderer/dom-adapter.mjs";
import { DomMotionAdapter } from "/platform/renderer/dom-motion-adapter.mjs";
import { MotionRendererSession } from "/platform/renderer/motion-renderer-session.mjs";
import { MotionRuntime } from "/platform/motion/motion-runtime.mjs";
import { EventFrameScheduler } from "/platform/scheduler/event-frame-scheduler.mjs";
import { createPlatformCapabilities } from "/platform/host/platform-capabilities.mjs";
import { createRpcCapabilities } from "/platform/host/rpc-capabilities.mjs";
import { createMediaCapabilities } from "/platform/host/media-capabilities.mjs";
import { createTimerCapabilities } from "/platform/host/timer-capabilities.mjs";
import { createProjectAssetRegistry } from "/platform/host/asset-registry.mjs";
import { createLifecycleBridge, createSerializedEventQueue } from "/platform/host/lifecycle-bridge.mjs";
import { createKeyboardViewportManager } from "/platform/host/keyboard-viewport-manager.mjs";
import { waitForFirstPaint } from "/platform/host/first-paint-gate.mjs";

const status = document.querySelector("#status");
const errorOutput = document.querySelector("#error");
const hostRoot = document.querySelector("#host-root");
const moduleIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;

/* LUASTRA_RPC_PROOF_START */
/* LUASTRA_RPC_PROOF_END */

function fail(message) { throw new Error(message); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function canonicalJson(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }
async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function publishVmOutput(vmResponse) {
  const output = typeof vmResponse?.output === "string" ? vmResponse.output : "";
  const records = output.split("\n").filter((line) => line.length > 0).map((line) => {
    const matched = /^\[luastra:(log|warn|error)\]\t?(.*)$/.exec(line);
    return matched ? { level: matched[1], message: matched[2] } : { level: "log", message: line };
  });
  for (const record of records) (console[record.level] ?? console.log)(`[Luastra] ${record.message}`);
  if (records.length > 0 && ["127.0.0.1", "localhost"].includes(location.hostname) && location.port !== "") {
    fetch("/__luastra/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
      keepalive: true,
    }).catch(() => {});
  }
}

function graphOrder(modules) {
  const byId = new Map();
  for (const module of modules) {
    if (!moduleIdPattern.test(module.id ?? "") || byId.has(module.id)) fail(`invalid or duplicate module: ${module.id}`);
    byId.set(module.id, module);
  }
  const state = new Map();
  const order = [];
  const visit = (id) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") fail(`module cycle: ${id}`);
    const module = byId.get(id);
    if (!module) fail(`missing module: ${id}`);
    state.set(id, "visiting");
    for (const dependency of [...module.dependencies].sort()) visit(dependency);
    state.set(id, "done");
    order.push(id);
  };
  for (const id of [...byId.keys()].sort()) visit(id);
  return order;
}

async function loadBundle(vmIdentity) {
  const response = await fetch("/bundle/luastra.bundle.json", { cache: "no-store" });
  if (!response.ok) fail(`bundle HTTP ${response.status}`);
  const bundle = await response.json();
  if (bundle.schemaVersion !== 1 || bundle.profile !== "trusted-vm-only" || bundle.compatibility.protocol !== 1) fail("unsupported bundle");
  if (bundle.compatibility.vm !== vmIdentity || !bundle.capabilities.includes("ui.render")) fail("runtime or capability mismatch");
  const content = { ...bundle };
  delete content.contentSha256;
  if (await sha256(new TextEncoder().encode(canonicalJson(content))) !== bundle.contentSha256) fail("bundle digest mismatch");
  const order = graphOrder(bundle.modules);
  if (order.join("\n") !== bundle.modules.map((module) => module.id).join("\n")) fail("non-canonical module order");
  const modules = [];
  for (const module of bundle.modules) {
    if (module.bytecodeFile !== `modules/${module.bytecodeSha256}.luauc`) fail("non-canonical bytecode path");
    const bytecodeResponse = await fetch(`/bundle/${module.bytecodeFile}`, { cache: "no-store" });
    const bytecode = new Uint8Array(await bytecodeResponse.arrayBuffer());
    if (!bytecodeResponse.ok || bytecode.byteLength !== module.bytecodeBytes || await sha256(bytecode) !== module.bytecodeSha256) fail(`bytecode verification failed: ${module.id}`);
    modules.push({ ...module, bytecode });
  }
  return { bundle, modules };
}

async function start() {
  const runtime = await createLuastraVm({ locateFile: (file) => `/platform/artifacts/vm-wasm/${file}` });
  const version = runtime.cwrap("luastra_vm_wasm_version", "string", []);
  const memoryBytes = runtime.cwrap("luastra_vm_wasm_memory_bytes", "number", []);
  const createSession = runtime.cwrap("luastra_vm_session_create", "number", []);
  const addModule = runtime.cwrap("luastra_vm_session_add_module", "string", ["number", "string", "number", "number"]);
  const allowCapability = runtime.cwrap("luastra_vm_session_allow_capability", "string", ["number", "string"]);
  const startSession = runtime.cwrap("luastra_vm_session_start_ui", "string", ["number", "string"]);
  const dispatchSession = runtime.cwrap("luastra_vm_session_dispatch", "string", ["number", "string", "string", "string"]);
  const takeRequest = runtime.cwrap("luastra_vm_session_take_request", "string", ["number"]);
  const resolveRpc = runtime.cwrap("luastra_vm_session_resolve_rpc", "string", ["number", "number", "number", "string", "string", "string", "string"]);
  const destroySession = runtime.cwrap("luastra_vm_session_destroy", "string", ["number"]);
  const { bundle, modules } = await loadBundle(version());
  const assetRegistry = createProjectAssetRegistry();
  await assetRegistry.load();
  const materialize = (renderTree) => materializeRendererTree(renderTree, {
    resolveAsset: (reference, kind) => assetRegistry.resolveLoaded(reference, kind).url,
  });
  document.documentElement.dataset.luastraProject = bundle.project.id;
  const handle = createSession();
  if (!handle) fail("session allocation failed");
  for (const module of modules) {
    const pointer = runtime._malloc(module.bytecode.byteLength);
    try {
      if (!pointer) fail(`allocation failed: ${module.id}`);
      runtime.writeArrayToMemory(module.bytecode, pointer);
      const added = JSON.parse(addModule(handle, module.id, pointer, module.bytecode.byteLength));
      if (!added.success) fail(`module rejected: ${added.error}`);
    } finally {
      if (pointer) runtime._free(pointer);
    }
  }
  for (const capability of bundle.capabilities.filter((item) => Protocol.capability.requestKinds.includes(item))) {
    const allowed = JSON.parse(allowCapability(handle, capability));
    if (!allowed.success) fail(`capability rejected: ${allowed.error}`);
  }

  let response = JSON.parse(startSession(handle, bundle.project.entry));
  publishVmOutput(response);
  const initialTreeError = response.success ? rendererTreeError(response.renderTree) : null;
  if (!response.success || initialTreeError !== null) fail(`application start failed: ${response.error ?? initialTreeError}`);
  const initialTree = materialize(response.renderTree);
  let tree = null;
  let adapter;
  let motionSession;
  const ledger = new RequestLedger();
  const platformCapabilities = createPlatformCapabilities(bundle.project.id);
  const rpcCapabilities = createRpcCapabilities({ authorizationToken: () => platformCapabilities.cached("session.token") });
  const mediaCapabilities = createMediaCapabilities();
  const timerCapabilities = createTimerCapabilities();
  const publishState = () => {
    window.__luastraPreview = { result: "PASS", project: bundle.project.id, contentSha256: bundle.contentSha256, renderSequence: response.renderSequence };
  };
  const renderResponse = (nextResponse) => {
    publishVmOutput(nextResponse);
    const treeError = nextResponse.success ? rendererTreeError(nextResponse.renderTree) : null;
    if (!nextResponse.success || treeError !== null) fail(`event failed: ${nextResponse.error ?? treeError}`);
    const nextTree = materialize(nextResponse.renderTree);
    motionSession.render(nextTree, { sequence: nextResponse.renderSequence });
    response = nextResponse;
    publishState();
  };
  const processRequests = async () => {
    while (true) {
      const taken = JSON.parse(takeRequest(handle));
      if (!taken.success) fail(`request queue failed: ${taken.error}`);
      if (taken.request === null) return;
      const request = taken.request;
      if (!validateCapabilityRequest(request)) fail("VM emitted invalid capability request");
      const capabilityHandler = globalThis.__luastraCapabilityHandler ?? (request.kind === "rpc.call" ? rpcCapabilities.handle : request.kind === "media.command" ? mediaCapabilities.handle : request.kind === "timer.control" ? timerCapabilities.handle : platformCapabilities.handle);
      const begun = ledger.begin(request, performance.now());
      if (!begun.accepted) fail(`host ledger rejected request: ${begun.reason}`);
      const handled = await capabilityHandler(request);
      if (handled?.accepted !== true || !validateCapabilityResponse(handled.response)) {
        fail(`host handler rejected request: ${handled?.reason ?? "INVALID_RESPONSE"}`);
      }
      const settled = ledger.settle(handled.response, performance.now());
      if (!settled.accepted) fail(`host ledger rejected response: ${settled.reason}`);
      const rpc = request.kind === "rpc.call" ? handled.response.payload : null;
      if (request.kind === "rpc.call" && (handled.response.status !== "ok" || !validateRpcResponse(rpc, request.traceId, request.payload.operation))) {
        const dataKeys = rpc?.data && typeof rpc.data === "object" ? Object.keys(rpc.data).sort().join(",") : "none";
        fail(`host handler returned invalid typed RPC response for ${request.payload.operation} (status=${handled.response.status}, success=${String(rpc?.success)}, error=${String(rpc?.error?.code ?? "none")}, result=${String(Protocol.rpc.operations[request.payload.operation]?.result ?? "unknown")}, dataKeys=${dataKeys}, payloadType=${typeof rpc?.data?.payload}, payloadBytes=${String(typeof rpc?.data?.payload === "string" ? new TextEncoder().encode(rpc.data.payload).byteLength : -1)})`);
      }
      const success = handled.response.status === "ok" && (rpc === null || rpc.success);
      const payload = rpc === null ? handled.response.payload : (rpc.success ? (request.payload.operation === "server.call.v1" ? rpc.data.payload : JSON.stringify(rpc.data)) : "");
      const error = rpc === null ? handled.response.payload : rpc.error;
      renderResponse(JSON.parse(resolveRpc(
        handle,
        request.requestId,
        success ? 1 : 0,
        success ? payload : "",
        success ? "" : error.code,
        success ? "" : error.message,
        request.traceId,
      )));
    }
  };
  adapter = new DomAdapter(hostRoot, {
    dispatch({ action, target, value }) {
      try {
        renderResponse(JSON.parse(dispatchSession(handle, action, target, value)));
        processRequests().catch(showFailure);
      } catch (error) { showFailure(error); }
    },
  });
  const keyboardViewport = createKeyboardViewportManager({ root: hostRoot });
  const scheduler = new EventFrameScheduler({
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (handle) => cancelAnimationFrame(handle),
    onError: showFailure,
  });
  const motion = new MotionRuntime({
    scheduler,
    adapter: new DomMotionAdapter((target) => adapter.node(target)),
    reducedMotion: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  let clearDiagnostics = () => {};
  if (new URLSearchParams(location.search).get("luastraDiagnostics") === "1") {
    const diagnostics = Object.freeze({
      snapshot() {
        return Object.freeze({
          result: window.__luastraPreview?.result ?? "STARTING",
          renderSequence: response.renderSequence,
          pendingRequests: ledger.size,
          activeMotionCount: motion.activeCount,
          activeFrameTaskCount: scheduler.activeTaskCount,
          framePending: scheduler.framePending,
          wasmMemoryBytes: memoryBytes(),
          domNodeCount: hostRoot.querySelectorAll("*").length,
        });
      },
    });
    Object.defineProperty(window, "__luastraDiagnostics", { configurable: true, value: diagnostics });
    clearDiagnostics = () => { delete window.__luastraDiagnostics; };
  }
  motionSession = new MotionRendererSession({
    render(nextTree) {
      const patches = reconcile(tree, nextTree);
      adapter.applyBatch(patches);
      tree = nextTree;
      return patches;
    },
    dispose() { scheduler.dispose(); },
  }, motion);
  const nativePlatform = globalThis.Capacitor?.isNativePlatform?.() === true;
  const deferInitialMotion = nativePlatform && globalThis.Capacitor?.getPlatform?.() === "ios";
  let clearHostVisibilitySignal = () => {};
  if (deferInitialMotion) {
    let revealed = false;
    const reveal = () => {
      if (revealed) return 0;
      revealed = true;
      clearHostVisibilitySignal();
      return motionSession.activateDeferredMotion();
    };
    Object.defineProperty(window, "__luastraHostDidBecomeVisible", { configurable: true, value: reveal });
    clearHostVisibilitySignal = () => {
      if (window.__luastraHostDidBecomeVisible === reveal) delete window.__luastraHostDidBecomeVisible;
    };
  }
  motionSession.render(initialTree, { sequence: response.renderSequence, deferMotion: deferInitialMotion });
  // Capacitor's iOS bridge may use a JS prompt. WebKit blanks a page when a
  // prompt arrives before its first paint, so let the initial semantic UI
  // commit before any application request or native subscription can bridge.
  await waitForFirstPaint();
  await processRequests();
  const hostEvents = createSerializedEventQueue({
    async dispatch(event) {
      if (event.action === "lifecycle") mediaCapabilities.handleLifecycle(event.value);
      renderResponse(JSON.parse(dispatchSession(handle, event.action, event.target, event.value)));
      await processRequests();
    },
    onError: showFailure,
  });
  const unsubscribeTimer = timerCapabilities.subscribe((event) => hostEvents.enqueue(event));
  await platformCapabilities.subscribeUrlOpen((url, source) => {
    hostEvents.enqueue(
      { action: "open_url", target: source === "browser" ? "browser" : "app", value: url },
      { dedupeKey: `url:${source}:${url}` },
    );
  });
  if (bundle.capabilities.includes("navigation.history")) await platformCapabilities.subscribeSystemBack((intent) => {
    hostEvents.enqueue({ action: "system_back", target: "app", value: intent }, { dedupeKey: `system-back:${intent}` });
  });
  const unsubscribeHistory = platformCapabilities.subscribeHistory((token) => {
    hostEvents.enqueue({ action: "history", target: "app", value: token }, { dedupeKey: `history:${token}` });
  });
  const unsubscribeMedia = mediaCapabilities.subscribe((value) => {
    try {
      renderResponse(JSON.parse(dispatchSession(handle, "media_state", "app", value)));
      processRequests().catch(showFailure);
    }
    catch (error) { showFailure(error); }
  });
  const lifecycle = createLifecycleBridge({
    windowTarget: window,
    documentTarget: document,
    navigatorState: navigator,
    appPlugin: globalThis.Capacitor?.isNativePlatform?.() === true ? globalThis.Capacitor.Plugins?.App ?? null : null,
    dispatch: (event) => hostEvents.enqueue(event),
    onError: showFailure,
    eventQueue: hostEvents,
  });
  await lifecycle.start();
  status.textContent = "Luastra preview ready";
  status.classList.add("pass");
  publishState();
  const shouldSelfTest = new URLSearchParams(location.search).get("luastraSelfTest") === "interaction";
  if (shouldSelfTest) {
    if (nativePlatform) await new Promise((accept) => setTimeout(accept, 500));
    const control = hostRoot.querySelector("button");
    if (!control) fail("host interaction self-test found no button");
    if (nativePlatform) {
      for (let attempt = 0; control.disabled && attempt < 100; attempt += 1) {
        await new Promise((accept) => setTimeout(accept, 50));
      }
    }
    if (control.disabled) fail("host interaction self-test found no enabled primary button");
    const initialSequence = response.renderSequence;
    control.click();
    for (let attempt = 0; response.renderSequence === initialSequence && attempt < 40; attempt += 1) {
      await new Promise((accept) => setTimeout(accept, 50));
    }
    if (response.renderSequence <= initialSequence) fail("host interaction self-test did not advance the render sequence");
    status.textContent = "Luastra host self-test passed";
  }
  addEventListener("pagehide", () => {
    clearDiagnostics();
    clearHostVisibilitySignal();
    motionSession.dispose();
    lifecycle.dispose();
    try { dispatchSession(handle, "lifecycle", "app", "dispose"); } catch {}
    hostEvents.dispose();
    platformCapabilities.dispose();
    unsubscribeHistory();
    rpcCapabilities.dispose();
    unsubscribeMedia();
    mediaCapabilities.dispose();
    unsubscribeTimer();
    timerCapabilities.dispose();
    keyboardViewport.dispose();
    ledger.dispose();
    destroySession(handle);
  }, { once: true });
}

function showFailure(error) {
  status.hidden = false;
  status.textContent = "Luastra preview failed";
  status.classList.add("fail");
  errorOutput.hidden = false;
  const message = String(error?.message ?? error);
  const stack = String(error?.stack ?? "");
  errorOutput.textContent = stack && !stack.startsWith(message) ? `${message}\n\n${stack}` : stack || message;
  window.__luastraPreview = { result: "FAIL", error: String(error?.message ?? error) };
}

start().catch(showFailure);

const reloadEvents = new EventSource("/__luastra/events");
reloadEvents.addEventListener("reload", () => location.reload());
reloadEvents.addEventListener("build-error", (event) => showFailure(new Error(`Hot reload build failed: ${event.data}`)));
