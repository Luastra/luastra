import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { computeOrbitLayout, decodeOrbitPreferences, focusTransitionGeometry, manageOrbitAnimation, nearestDirectionalNode, parseOrbitDuration, resolveOrbitRelationships, resolveOrbitSemanticDetail, resolveOrbitSemanticOrder, resolveOrbitTabStop } from "../platform/host/orbit-controller.mjs";
import { createPlatformCapabilities } from "../platform/host/platform-capabilities.mjs";
import { buildProject } from "../project/build-project.mjs";
import { testProject } from "../project/test-project.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { component, reconcile } from "../platform/renderer/reconciler.mjs";

const repository = resolve(import.meta.dirname, "..");
const orbitThemes = ["luastra", "abyss", "sakura", "atlas", "arctic", "biolume", "arcade", "bauhaus", "editorial", "copper", "candy"];
const orbitCapabilities = ["app.launchurl.get", "navigation.history", "storage.get", "storage.set", "timer.control", "ui.render"];

function text(id, value) { return component("Text", { id, text: value }); }
function findRenderNode(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = findRenderNode(child, id);
    if (found) return found;
  }
  return null;
}
function relativeLuminance(hex) {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex) ? `#${[...hex.slice(1)].map((value) => value + value).join("")}` : hex;
  const channels = [1, 3, 5].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrastRatio(left, right) {
  const luminances = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}
function focusThemeTokens(css, theme) {
  const block = new RegExp(`\\.luastra-orbit:is\\([^\\{]*luastra-orbit-theme-${theme}[^\\{]*\\)\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  const token = (name) => new RegExp(`--luastra-orbit-focus-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block)?.[1]?.toLowerCase() ?? null;
  return { background: token("bg"), ink: token("ink"), muted: token("muted"), controlBackground: token("control-bg"), controlInk: token("control-ink"), border: token("border") };
}
function orbitThemeTokens(css, theme) {
  const pattern = theme === "luastra"
    ? /\.luastra-orbit\s*\{([^}]*)\}/
    : new RegExp(`\\.luastra-orbit\\[data-luastra-orbit-theme=["']${theme}["']\\]\\s*\\{([^}]*)\\}`);
  const block = pattern.exec(css)?.[1] ?? "";
  const token = (name) => new RegExp(`--luastra-orbit-${name}:\\s*(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)`).exec(block)?.[1]?.toLowerCase() ?? null;
  return { background: token("bg"), ink: token("ink") };
}

test("Orbit composes stable semantic primitives without application-owned coordinates", () => {
  const center = component("Column", { id: "orbit/root/center", className: "luastra-column luastra-orbit-center" }, [text("orbit/root/center/title", "Luastra")]);
  const node = component("Button", { id: "orbit/root/node", className: "luastra-button luastra-orbit-node luastra-orbit-ring-1", onTap: "open-focus", orbitSignalIcon: "rocket" }, [text("orbit/root/node/title", "Node")]);
  const inactive = component("Layer", {
    id: "orbit/root",
    className: "luastra-layer luastra-constellation luastra-constellation-state-behind luastra-constellation-depth-1",
  }, [center, node]);
  const orbit = component("Column", {
    id: "orbit",
    label: "Application map",
    className: "luastra-column luastra-orbit luastra-orbit-presentation-auto luastra-orbit-theme-abyss luastra-orbit-motion-off luastra-orbit-max-12",
  }, [inactive]);

  assert.equal(orbit.tag, "section");
  assert.equal(node.tag, "button");
  assert.equal(node.attributes["data-luastra-orbit-signal-icon"], "rocket");
  assert.throws(() => component("Button", { id: "orbit/root/invalid", label: "Invalid", orbitSignalIcon: "letter-s" }), /invalid Orbit signal icon/);
  assert.equal(Object.keys(node.attributes).some((name) => name.includes("orbit-x")), false);
  assert.doesNotThrow(() => reconcile(null, orbit));
});

test("Orbit layout is deterministic and falls back using both dimensions and node pressure", () => {
  const nodes = Array.from({ length: 8 }, (_, index) => ({ id: `node-${index + 1}` }));
  const spatial = computeOrbitLayout({ width: 1000, height: 700, nodes });
  assert.equal(spatial.mode, "spatial");
  assert.deepEqual(spatial, computeOrbitLayout({ width: 1000, height: 700, nodes }));
  assert.equal(new Set(spatial.points.map(({ x, y }) => `${x}:${y}`)).size, nodes.length);
  assert.equal(computeOrbitLayout({ width: 1000, height: 460, nodes }).mode, "list", "short landscape layouts must not clip spatial controls");
  assert.equal(computeOrbitLayout({ width: 520, height: 900, nodes }).mode, "list", "narrow layouts must remain readable");
  assert.equal(computeOrbitLayout({ width: 600, height: 600, nodes: nodes.slice(0, 4) }).mode, "list", "unsafe center collisions must use the complete list presentation");
  assert.equal(computeOrbitLayout({ width: 363, height: 479, nodes }).mode, "list", "200 percent reflow equivalent must use the complete list presentation");
  assert.equal(computeOrbitLayout({ width: 1000, height: 700, nodes: [{ id: "long", titleUnits: 35 }] }).mode, "list", "long labels must not be compressed into spatial nodes");
  assert.equal(computeOrbitLayout({ width: 1000, height: 700, nodes: nodes.map((node) => ({ ...node, descriptionUnits: 160 })) }).mode, "spatial", "supporting copy pressure should be handled by semantic detail instead of discarding safe spatial layout");
  assert.equal(computeOrbitLayout({ width: 1000, height: 700, nodes: nodes.slice(0, 4).map((node) => ({ ...node, width: 700 })) }).mode, "list", "measured node bounds must not overlap the center");
  assert.equal(computeOrbitLayout({ width: 1000, height: 700, nodes: [...nodes, ...nodes.map((node) => ({ id: `extra-${node.id}` }))], maxVisible: 12 }).mode, "list");
  assert.equal(computeOrbitLayout({ width: 520, height: 460, nodes, presentation: "spatial" }).mode, "list", "an explicit spatial preference cannot override layout safety");
});

test("Orbit semantic zoom selects signal, identity and preview without changing authored content", () => {
  const nodes = [
    { id: "orbit/primary", priority: 1, signalIcon: "spark" },
    { id: "orbit/secondary", priority: 2, signalIcon: "book" },
    { id: "orbit/peripheral", priority: 3, signalIcon: "rocket" },
    { id: "orbit/fallback", priority: 3 },
  ];
  const placements = nodes.map((node, index) => ({ id: node.id, ring: Math.min(3, index + 1), slot: 0 }));
  assert.deepEqual(resolveOrbitSemanticDetail({ width: 1200, height: 760, mode: "spatial", nodes, placements }).map(({ detail }) => detail),
    ["preview", "preview", "preview", "preview"], "a generous workspace should retain every preview");
  assert.deepEqual(resolveOrbitSemanticDetail({ width: 820, height: 700, mode: "spatial", nodes, placements }).map(({ detail }) => detail),
    ["preview", "identity", "signal", "identity"], "pressure should preserve importance and never invent a missing signal");
  assert.deepEqual(resolveOrbitSemanticDetail({ width: 620, height: 540, mode: "spatial", nodes: nodes.slice(2, 3), placements: placements.slice(2, 3) }),
    [{ id: "orbit/peripheral", detail: "preview" }], "a sparse filtered result should expand into the available space");
  assert.deepEqual(resolveOrbitSemanticDetail({ width: 520, height: 460, mode: "list", nodes, placements }).map(({ detail }) => detail),
    ["preview", "preview", "preview", "preview"], "list presentation should retain complete preview content");
});

test("Orbit relationships resolve into a stable undirected graph", () => {
  const edges = resolveOrbitRelationships([
    { id: "orbit/a", relatedTo: ["orbit/b", "orbit/missing", "orbit/a"] },
    { id: "orbit/b", relatedTo: ["orbit/a", "orbit/c"] },
    { id: "orbit/c", relatedTo: [] },
  ]);
  assert.deepEqual(edges, [
    { source: "orbit/a", target: "orbit/b" },
    { source: "orbit/b", target: "orbit/c" },
  ]);
});

test("Orbit relationships influence automatic rings and angular neighbors deterministically", () => {
  const nodes = Array.from({ length: 12 }, (_, index) => ({ id: `orbit/node-${index + 1}`, priority: 2 }));
  nodes[11] = { ...nodes[11], relatedTo: nodes.slice(0, 5).map(({ id }) => id) };
  nodes[10] = { ...nodes[10], ring: 2, priority: 1 };
  const first = resolveOrbitSemanticOrder(nodes);
  const second = resolveOrbitSemanticOrder(nodes);
  assert.deepEqual(first, second);
  assert.equal(first.find(({ id }) => id === "orbit/node-12").ring, 1, "a connected hub should enter the bounded inner ring");
  assert.equal(first.find(({ id }) => id === "orbit/node-11").ring, 2, "an explicit ring remains authoritative");
  const hub = first.find(({ id }) => id === "orbit/node-12");
  const inner = first.filter(({ ring }) => ring === hub.ring);
  const next = inner[(hub.slot + 1) % inner.length];
  assert.ok(nodes[11].relatedTo.includes(next.id), "a related node should occupy the next angular slot when available");
});

test("Orbit keeps a 50-item constellation bounded in one deterministic list", () => {
  const nodes = Array.from({ length: 50 }, (_, index) => ({ id: `example-${index + 1}`, titleUnits: 18, descriptionUnits: 42 }));
  const first = computeOrbitLayout({ width: 1440, height: 900, nodes, maxVisible: 32 });
  const second = computeOrbitLayout({ width: 1440, height: 900, nodes, maxVisible: 32 });
  assert.equal(first.mode, "list");
  assert.equal(first.points.length, 50);
  assert.deepEqual(first, second);
  assert.deepEqual(first.points.map(({ id }) => id), nodes.map(({ id }) => id));
});

test("geometric keyboard navigation prefers the requested direction", () => {
  const points = [{ x: 0, y: 0 }, { x: 100, y: 5 }, { x: 15, y: 100 }, { x: -100, y: 0 }];
  assert.equal(nearestDirectionalNode(points, 0, "ArrowRight"), 1);
  assert.equal(nearestDirectionalNode(points, 0, "ArrowDown"), 2);
  assert.equal(nearestDirectionalNode(points, 0, "ArrowLeft"), 3);
});

test("Orbit tab stops preserve active focus and restore focus per constellation", () => {
  const nodes = ["one", "two", "three"].map((id) => ({ dataset: { luastraId: id } }));
  assert.equal(resolveOrbitTabStop(nodes, { activeElement: nodes[1], rememberedId: "three", selectedElement: nodes[0] }), nodes[1]);
  assert.equal(resolveOrbitTabStop(nodes, { rememberedId: "three", selectedElement: nodes[0] }), nodes[2]);
  assert.equal(resolveOrbitTabStop(nodes, { rememberedId: "missing", selectedElement: nodes[1] }), nodes[1]);
  assert.equal(resolveOrbitTabStop(nodes), nodes[0]);
  assert.equal(resolveOrbitTabStop([]), null);
});

test("Orbit preferences admit only versioned canonical themes and motion", () => {
  assert.deepEqual(decodeOrbitPreferences("v1:atlas:off"), { theme: "atlas", motion: "off" });
  assert.deepEqual(decodeOrbitPreferences("v1:arcade:system"), { theme: "arcade", motion: "system" });
  for (const value of ["", "v2:atlas:off", "v1:unknown:off", "v1:atlas:on", "v1:atlas:off:extra", 42]) {
    assert.equal(decodeOrbitPreferences(value), null);
  }
});

test("every Orbit theme defines a readable Focus Surface palette", async () => {
  const css = await readFile(resolve(repository, "platform/host/orbit.css"), "utf8");
  for (const theme of orbitThemes) {
    const colors = focusThemeTokens(css, theme);
    const orbitColors = orbitThemeTokens(css, theme);
    assert.equal(Object.values(colors).every(Boolean), true, `${theme} must define every Focus Surface token`);
    assert.equal(Object.values(orbitColors).every(Boolean), true, `${theme} must define Orbit background and ink tokens`);
    assert.ok(contrastRatio(orbitColors.background, orbitColors.ink) >= 4.5, `${theme} Orbit search status contrast`);
    assert.ok(contrastRatio(colors.background, colors.ink) >= 4.5, `${theme} Focus Surface text contrast`);
    assert.ok(contrastRatio(colors.background, colors.muted) >= 4.5, `${theme} Focus Surface muted contrast`);
    assert.ok(contrastRatio(colors.controlBackground, colors.controlInk) >= 4.5, `${theme} Focus Surface control contrast`);
    assert.ok(contrastRatio(colors.background, colors.border) >= 3, `${theme} Focus Surface boundary contrast`);
  }
});

test("Focus Surface geometry is deterministic, bounded and token-timed", () => {
  assert.deepEqual(
    focusTransitionGeometry(
      { left: 100, top: 120, width: 160, height: 80 },
      { left: 40, top: 20, width: 640, height: 480 },
    ),
    { translateX: -180, translateY: -100, scaleX: 0.25, scaleY: 1 / 6 },
  );
  assert.equal(focusTransitionGeometry({ left: 0, top: 0, width: 0, height: 10 }, { left: 0, top: 0, width: 10, height: 10 }), null);
  assert.equal(parseOrbitDuration("620ms", 100), 620);
  assert.equal(parseOrbitDuration("0.52s", 100), 520);
  assert.equal(parseOrbitDuration("invalid", 100), 100);
  assert.equal(parseOrbitDuration("10s", 100), 2000);
});

test("Orbit animation cancellation settles synchronously and only once", async () => {
  let finish;
  let cancellations = 0;
  let settlements = 0;
  const animation = {
    cancel() { cancellations += 1; },
    finished: new Promise((resolve) => { finish = resolve; }),
  };
  const managed = manageOrbitAnimation(animation, () => { settlements += 1; });
  managed.cancel();
  managed.cancel();
  assert.equal(managed.settled, true);
  assert.equal(cancellations, 1);
  assert.equal(settlements, 1);
  finish();
  await animation.finished;
  await Promise.resolve();
  assert.equal(settlements, 1, "a late animation completion must not settle an invalidated transition again");
});

test("Constellation Orbit reference compiles, tests and packages its host-owned assets", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-orbit-"));
  try {
    const manifest = resolve(repository, "examples/constellation-orbit/luastra.json");
    const bundleDirectory = resolve(workspace, "bundle");
    const webDirectory = resolve(workspace, "web");
    await buildProject({ manifestPath: manifest, outputDirectory: bundleDirectory, target: "bundle" });
    await buildProject({ manifestPath: manifest, outputDirectory: webDirectory, target: "web" });
    const projectTests = await testProject(manifest);
    assert.equal(projectTests.passed, 1);
    const actionRequests = [];
    const result = await runWasmBundle({
      bundlePath: resolve(bundleDirectory, "luastra.bundle.json"),
      runtimeModulePath: resolve(repository, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: orbitCapabilities,
      requireRendererTree: true,
      dispatches: [
        { action: "open-constellation", target: "orbit/explore", value: "" },
        { action: "run-orbit-action", target: "orbit/build/optimize", value: "" },
      ],
      async capabilityHandler(request) {
        actionRequests.push(request);
        return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload: "scheduled" } };
      },
    });
    assert.match(result.renderTree.children[0].properties.className, /luastra-orbit/);
    assert.equal(actionRequests.length, 1);
    assert.equal(actionRequests[0].kind, "timer.control");
    assert.equal(actionRequests[0].payload.operation, "orbit/optimize");
    const busyAction = findRenderNode(result.renderTree, "orbit/build/optimize");
    assert.equal(busyAction.properties.busy, true);
    assert.equal(busyAction.properties.disabled, true);
    assert.equal(findRenderNode(busyAction, "orbit/build/optimize/status").properties.text, "Working");
    const orbitCss = await readFile(resolve(webDirectory, "platform/host/orbit.css"), "utf8");
    const orbitController = await readFile(resolve(webDirectory, "platform/host/orbit-controller.mjs"), "utf8");
    assert.match(orbitCss, /prefers-reduced-motion/);
    assert.match(orbitCss, /\.luastra-orbit-path \.luastra-button\s*\{[^}]+min-height:\s*2\.75rem/s);
    assert.match(orbitCss, /@media \(forced-colors: active\)/);
    assert.match(orbitCss, /--luastra-orbit-focus-bg:\s*Canvas/);
    assert.match(orbitCss, /--luastra-orbit-focus-control-bg:\s*ButtonFace/);
    assert.match(orbitCss, /\.luastra-orbit, \.luastra-focus-surface, \.luastra-focus-transition-copy\s*\{\s*forced-color-adjust:\s*auto/);
    assert.match(orbitCss, /#host-root \.luastra-focus-surface \.luastra-button:hover\s*\{[^}]+filter:\s*none[^}]+box-shadow:\s*none/s);
    assert.match(orbitCss, /\.luastra-orbit-node\[aria-current=["']page["']\][^{]+\{[^}]+Highlight/s);
    for (const theme of orbitThemes.slice(1)) assert.match(orbitCss, new RegExp(`data-luastra-orbit-theme=["']${theme}["']`));
    assert.match(orbitCss, /data-luastra-orbit-motion=["']off["']/);
    assert.match(orbitCss, /@keyframes luastra-orbit-enter-ahead/);
    assert.match(orbitCss, /@keyframes luastra-orbit-enter-behind/);
    assert.match(orbitCss, /prefers-reduced-motion[\s\S]+constellation\[data-luastra-orbit-transition\][^}]+animation:\s*none/s);
    assert.match(orbitCss, /\.luastra-orbit-cluster\s*\{[^}]+border-style:\s*double/s);
    assert.match(orbitCss, /#host-root \.luastra-orbit-cluster \.luastra-orbit-cluster-count\s*\{[^}]+margin-block-start:\s*\.18rem/s);
    assert.match(orbitCss, /:is\(\.luastra-orbit-node\[data-luastra-orbit-node-kind=["']constellation["']\], \.luastra-orbit-cluster\):not\(\[data-luastra-orbit-detail=["']signal["']\]\)\s*\{[^}]+padding-inline-end:\s*2\.65rem/s);
    assert.match(orbitCss, /--luastra-orbit-list-center-radius:\s*999px/);
    assert.match(orbitCss, /--luastra-orbit-list-node-radius:\s*18px/);
    assert.match(orbitCss, /data-luastra-orbit-theme=["']biolume["'][^}]+--luastra-orbit-list-node-radius:\s*24px 12px/s);
    assert.match(orbitCss, /data-luastra-orbit-theme=["']biolume["'][^}]+--luastra-orbit-node-start-padding:\s*2rem/s);
    assert.match(orbitCss, /data-luastra-orbit-mode=["']list["'][^}]+\.luastra-orbit-node\s*\{[^}]+border-radius:\s*var\(--luastra-orbit-list-node-radius\)/s);
    assert.match(orbitCss, /data-luastra-orbit-mode=["']list["'][^}]+\.luastra-orbit-node\s*\{[^}]+padding-inline-start:\s*\.9rem/s);
    assert.match(orbitCss, /\.luastra-orbit-path\s*\{[^}]+height:\s*3\.5rem[^}]+overflow-y:\s*hidden/s);
    assert.match(orbitCss, /\.luastra-orbit-path \.luastra-text[^}]+text-overflow:\s*ellipsis/s);
    assert.match(orbitCss, /\.luastra-orbit-search\s*\{[^}]+z-index:\s*35[^}]+grid-template-columns:\s*minmax\(12rem, 1fr\)/s);
    assert.match(orbitCss, /\.luastra-orbit:has\(> \.luastra-orbit-search\) > \.luastra-constellation\s*\{[^}]+inset-block-start:\s*7\.75rem/s);
    assert.match(orbitCss, /\.luastra-focus-surface\s*\{[^}]+overscroll-behavior:\s*contain[^}]+scrollbar-gutter:\s*stable/s);
    assert.match(orbitCss, /\.luastra-focus-header\s*\{[^}]+position:\s*sticky[^}]+top:\s*calc\(0px - var\(--luastra-orbit-focus-padding\)\)[^}]+background:\s*var\(--luastra-orbit-focus-bg/s);
    assert.match(orbitCss, /\.luastra-focus-header \+ \*\s*\{[^}]+padding-block-start:\s*1rem/s);
    assert.match(orbitCss, /@media \(max-width:\s*420px\)[\s\S]+\.luastra-focus-header\s*\{[^}]+flex-direction:\s*column/s);
    assert.match(orbitCss, /data-luastra-orbit-mode=["']list["'][^}]+border-radius:\s*var\(--luastra-orbit-list-center-radius\)/s);
    assert.match(orbitCss, /\.luastra-orbit \.luastra-constellation > \.luastra-orbit-center\s*\{[^}]+width:\s*min\(15rem, 42%\)[^}]+height:\s*9rem/s);
    assert.match(orbitCss, /#host-root \.luastra-orbit-center > \*\s*\{[^}]+width:\s*min\(100%, 12rem\)/s);
    assert.match(orbitCss, /#host-root \.luastra-orbit-node > \.luastra-text:not\(:first-child\):not\(\.luastra-orbit-node-status\)[^{]+\{[^}]+color:\s*var\(--luastra-orbit-ink\)/s);
    assert.match(orbitCss, /data-luastra-orbit-detail=["']signal["'][^{]+\{[^}]+width:\s*4\.25rem/s);
    assert.match(orbitCss, /\.luastra-orbit-signal-icon\s*\{[^}]+stroke:\s*currentColor/s);
    assert.match(orbitCss, /data-luastra-orbit-detail=["']signal["'][^}]+> \.luastra-orbit-signal-icon\s*\{[^}]+inset-block-start:\s*\.4rem[^}]+inset-inline-end:\s*\.4rem/s);
    assert.match(orbitCss, /data-luastra-orbit-detail=["']signal["']\]:is\([^}]+::after\s*\{\s*display:\s*none/s);
    assert.match(orbitCss, /\.luastra-orbit-signal-reveal/);
    assert.match(orbitCss, /\.luastra-orbit-node:disabled\s*\{/);
    assert.match(orbitCss, /@keyframes luastra-orbit-spin/);
    assert.match(orbitCss, /data-luastra-orbit-detail=["']identity["'][^,]+\.luastra-text:not\(:first-child\):not\(\.luastra-orbit-cluster-count\)/s);
    assert.match(orbitCss, /#host-root \.luastra-orbit-node > \.luastra-orbit-node-status\s*\{[^}]+margin-block-start:\s*\.18rem[^}]+border:\s*1px solid var\(--luastra-orbit-status-color\)[^}]+color:\s*var\(--luastra-orbit-status-color\)/s);
    assert.match(orbitCss, /\.luastra-orbit-node \.luastra-orbit-status-success::before\s*\{\s*content:\s*["']✓["']/s);
    assert.match(orbitCss, /data-luastra-orbit-status-tone=["']warning["'][^{]+\{[^}]+border-style:\s*dashed/s);
    assert.match(orbitCss, /\.luastra-orbit \.luastra-constellation > \.luastra-orbit-node/);
    assert.match(orbitCss, /data-luastra-constellation-state=["']behind["'][^{]+\{[^}]+z-index:\s*10/s);
    assert.match(orbitCss, /data-luastra-constellation-state=["']active["'][^{]+\{[^}]+z-index:\s*20/s);
    assert.match(orbitCss, /--luastra-orbit-focus-duration:\s*620ms/);
    assert.match(orbitCss, /data-luastra-orbit-transition=["']closing["'][^}]+>\s*:not\(\.luastra-focus-transition-copy\)[^{]+\{[^}]+visibility:\s*hidden/s);
    assert.match(orbitCss, /\.luastra-focus-transition-copy\s*\{[^}]+z-index:\s*3/s);
    assert.match(orbitCss, /transform-origin:\s*var\(--luastra-orbit-origin-x\) var\(--luastra-orbit-origin-y\)/);
    assert.doesNotMatch(orbitCss, /var\(--luastra-orbit-node-width\)\s*\/\s*2/, "node centering must not depend on unsupported CSS variable division");
    assert.match(orbitController, /computeOrbitLayout/);
    assert.match(orbitController, /resolveOrbitSemanticDetail/);
    assert.match(orbitController, /luastraOrbitDetail/);
    assert.match(orbitController, /orbitSignalIconPaths/);
    assert.match(orbitController, /createElementNS/);
    assert.match(orbitController, /interactiveNodes/);
    assert.match(orbitController, /orbitStatusSymbols/);
    assert.match(orbitController, /luastraOrbitStatusTone/);
    assert.match(orbitController, /toggleAttribute\("hidden", layout\.mode !== "spatial"\)/);
    assert.match(orbitController, /constellation\.append\(layer\)/);
    assert.doesNotMatch(orbitController, /constellation\.prepend\(layer\)/);
    assert.match(orbitCss, /\.luastra-orbit-connections\[hidden\]\s*\{[^}]+display:\s*none/s);
    assert.match(orbitController, /surface\.animate/);
    assert.match(orbitController, /animateConstellationEntry/);
    assert.match(orbitController, /previousMode === ["']list["']/);
    assert.match(orbitController, /sourceKind !== ["']constellation["'] && sourceKind !== ["']cluster["']/);
    assert.match(orbitController, /cameraAnimation/);
    assert.match(orbitController, /luastraOrbitCameraTransitions/);
    assert.match(orbitController, /luastra-focus-transition-copy/);
    assert.match(orbitController, /deferFocusSurfaceClose/);
    assert.match(orbitController, /aria-current/);
    assert.match(orbitController, /aria-haspopup/);
    assert.match(orbitController, /aria-labelledby/);
    assert.match(orbitController, /focusSurfaceChanged/);
    assert.match(orbitController, /selectedId !== orbitState\.focusSurfaceNodeId/);
    assert.match(orbitController, /aria-live/);
    assert.match(orbitController, /event\.key === "Enter"/);
    assert.match(orbitController, /event\.key === "\/"/);
    assert.match(orbitController, /event\.target\.value = ""/);
    assert.match(orbitController, /EventConstructor\("cancel"/);
    assert.match(orbitController, /prefers-reduced-motion/);
    assert.match(orbitController, /orbit\.clientHeight - pathHeight/, "initial list presentation must not trap layout measurement in list mode");
    assert.match(orbitController, /unconditionallyUsesList/, "guaranteed list presentation should skip spatial-only inspection");
    assert.match(orbitController, /if \(layout\.mode === ["']spatial["']\)/, "list presentation should not rewrite unused spatial coordinates");
    assert.match(orbitController, /if \(!elements\.some\(\(element\) => \(element\.dataset\.luastraOrbitRelatedTo/, "unrelated nodes should skip relationship graph construction");
    assert.match(orbitController, /averageLayoutDurationMs/);
    assert.match(orbitController, /lastConstellationCount/);
    assert.match(orbitController, /luastraOrbitLayoutLastMs/);
    assert.match(await readFile(resolve(webDirectory, "main.js"), "utf8"), /platform\/host\/orbit\.css/);
    assert.match(await readFile(resolve(webDirectory, "main.js"), "utf8"), /orbitLayout:\s*orbitController\.diagnostics\(\)/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("Orbit preferences persist across fresh VM sessions without entering history", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-orbit-preferences-"));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const records = new Map();
  let historyState = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key) { return records.get(key) ?? null; },
      setItem(key, value) { records.set(key, String(value)); },
    },
  });
  try {
    const built = await buildProject({
      manifestPath: resolve(repository, "examples/constellation-orbit/luastra.json"),
      outputDirectory: workspace,
      target: "bundle",
    });
    const run = async (dispatches, href = "https://luastra.test/#/orbit") => {
      const platform = createPlatformCapabilities("dev.luastra.constellation-orbit", {
        locationTarget: { href, origin: "https://luastra.test" },
        historyTarget: {
          get state() { return historyState; },
          pushState(state) { historyState = state; },
          replaceState(state) { historyState = state; },
          back() {},
        },
        windowTarget: null,
      });
      try {
        return await runWasmBundle({
          bundlePath: built.bundlePath,
          runtimeModulePath: resolve(repository, "platform/artifacts/vm-wasm/luastra-vm.js"),
          allowedCapabilities: orbitCapabilities,
          capabilityHandler: platform.handle,
          dispatches,
          requireRendererTree: true,
        });
      } finally { platform.dispose(); }
    };
    const first = await run([
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "next-theme", target: "orbit/path/theme-next", value: "" },
      { action: "next-theme", target: "orbit/path/theme-next", value: "" },
      { action: "next-theme", target: "orbit/path/theme-next", value: "" },
      { action: "toggle-motion", target: "orbit/path/motion", value: "" },
    ]);
    assert.match(first.renderTree.children[0].properties.className, /luastra-orbit-theme-atlas/);
    assert.match(first.renderTree.children[0].properties.className, /luastra-orbit-motion-off/);
    assert.equal(records.get("luastra.dev.luastra.constellation-orbit.orbit-preferences"), "v1:atlas:off");

    const restored = await run([{ action: "lifecycle", target: "app", value: "launch" }]);
    assert.match(restored.renderTree.children[0].properties.className, /luastra-orbit-theme-atlas/);
    assert.match(restored.renderTree.children[0].properties.className, /luastra-orbit-motion-off/);
    assert.equal(restored.pendingRequests, 0);

    historyState = null;
    const direct = await run(
      [{ action: "lifecycle", target: "app", value: "launch" }],
      "https://luastra.test/#/orbit/examples/productivity/5",
    );
    assert.equal(findRenderNode(direct.renderTree, "orbit/focus").properties.open, true);
    assert.equal(findRenderNode(direct.renderTree, "orbit/focus/title").properties.text, "Focus Timer");
    assert.match(findRenderNode(direct.renderTree, "orbit/examples").properties.className, /luastra-constellation-state-active/);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    await rm(workspace, { recursive: true, force: true });
  }
});
