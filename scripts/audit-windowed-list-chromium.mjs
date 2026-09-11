import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) { throw new Error(message); }
function delay(milliseconds) { return new Promise((accept) => setTimeout(accept, milliseconds)); }

class CdpClient {
  #id = 0; #listeners = new Map(); #pending = new Map(); #socket;
  constructor(url) {
    this.#socket = new WebSocket(url);
    this.ready = new Promise((accept, reject) => {
      this.#socket.addEventListener("open", accept, { once: true });
      this.#socket.addEventListener("error", () => reject(new Error("CDP WebSocket failed")), { once: true });
    });
    this.#socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) {
        for (const listener of this.#listeners.get(message.method) ?? []) listener(message.params);
        return;
      }
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) pending.reject(new Error(`CDP ${pending.method} failed: ${JSON.stringify(message.error)}`));
      else pending.resolve(message.result);
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.#id;
    return new Promise((accept, reject) => {
      this.#pending.set(id, { method, resolve: accept, reject });
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? [];
    listeners.push(listener);
    this.#listeners.set(method, listeners);
  }
  close() { this.#socket.close(); }
}

async function waitForPage(port, process) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (process.exitCode !== null) fail(`Chromium exited before readiness (${process.exitCode})`);
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.ok ? response.json() : null).catch(() => null);
    const page = pages?.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (page) return page;
    await delay(50);
  }
  fail("Chromium CDP readiness timeout");
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) fail(`browser evaluation failed: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
  return result.result?.value;
}

async function waitFor(client, expression, description) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (await evaluate(client, expression)) return;
    await delay(25);
  }
  fail(`timeout waiting for ${description}`);
}

async function click(client, id) {
  const clicked = await evaluate(client, `(() => {
    const node = document.querySelector(${JSON.stringify(`[data-luastra-id="${id}"]`)});
    if (!node) return false;
    node.click();
    return true;
  })()`);
  if (!clicked) fail(`missing element: ${id}`);
}

async function pressKey(client, { code, key, keyCode }) {
  const parameters = { code, key, nativeVirtualKeyCode: keyCode, windowsVirtualKeyCode: keyCode };
  await client.send("Input.dispatchKeyEvent", { ...parameters, type: "rawKeyDown" });
  await client.send("Input.dispatchKeyEvent", { ...parameters, type: "keyUp" });
}

function accessibilitySample(nodes) {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const role = (node) => String(node?.role?.value ?? "").toLowerCase();
  const descendants = (node) => {
    const result = [];
    const visit = (current) => {
      result.push(current);
      for (const id of current?.childIds ?? []) visit(byId.get(id));
    };
    visit(node);
    return result.filter(Boolean);
  };
  const list = nodes.find((node) => role(node) === "list" && node.name?.value === "Retained records");
  const listItems = list ? descendants(list).filter((node) => role(node) === "listitem" && node.ignored !== true) : [];
  const itemNames = listItems.map((item) => descendants(item).find((node) => role(node) === "button")?.name?.value ?? null);
  const status = nodes.find((node) => role(node) === "status" && descendants(node).some((child) => String(child.name?.value ?? "").startsWith("Selected record ")));
  const live = status?.properties?.find((property) => property.name === "live")?.value?.value ?? null;
  return {
    itemNames,
    listIgnored: list?.ignored ?? null,
    listRole: list?.role?.value ?? null,
    statusLive: live,
    statusText: status ? descendants(status).map((node) => node.name?.value).filter(Boolean).join(" ") : null,
  };
}

async function main() {
  const repository = resolve(import.meta.dirname, "..");
  const delayedFont = await readFile(resolve(repository, "examples/typography/assets/fonts/atkinson-regular.woff2"));
  const profile = await mkdtemp(resolve(tmpdir(), "luastra-windowed-list-chromium-"));
  const application = await runProject({
    manifestPath: resolve(repository, "examples/state-foundations/luastra.json"),
    port: 4220,
    watch: false,
  });
  const browser = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9240",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    `${application.url}?luastraDiagnostics=1`,
  ], { stdio: "ignore" });
  let client = null;
  let delayedFontRequests = 0;
  let delayedFontError = null;
  try {
    const page = await waitForPage(9240, browser);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.ready;
    client.on("Fetch.requestPaused", ({ requestId }) => {
      delayedFontRequests += 1;
      delay(75).then(() => client.send("Fetch.fulfillRequest", {
        requestId,
        responseCode: 200,
        responseHeaders: [
          { name: "Content-Type", value: "font/woff2" },
          { name: "Cache-Control", value: "no-store" },
        ],
        body: delayedFont.toString("base64"),
      })).catch((error) => { delayedFontError = String(error?.message ?? error); });
    });
    await client.send("Fetch.enable", { patterns: [{ urlPattern: "*windowed-list-slice3.woff2", requestStage: "Request" }] });
    await client.send("Runtime.enable");
    await client.send("Emulation.setDeviceMetricsOverride", { width: 900, height: 700, deviceScaleFactor: 1, mobile: false });
    await waitFor(client, "window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");
    await click(client, "records/load");
    await waitFor(client, "document.querySelector('[data-luastra-id=\"records/count\"]')?.textContent === '100'", "initial records");
    for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) await click(client, "records/next");
    await waitFor(client, "document.querySelector('[data-luastra-id=\"records/first\"]')?.textContent === '101'", "bounded forward eviction");

    const anchorBefore = await evaluate(client, `(async () => {
      const anchor = document.querySelector('[data-luastra-id="records/items/record-101"]');
      scrollTo(0, scrollY + anchor.getBoundingClientRect().top);
      await new Promise((accept) => setTimeout(accept, 100));
      await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)));
      return anchor.getBoundingClientRect().top;
    })()`);
    try {
      await waitFor(client, "document.querySelector('[data-luastra-id=\"records/first\"]')?.textContent === '1'", "backward edge reload");
    } catch (error) {
      const debug = await evaluate(client, `(() => {
        const list = document.querySelector('[data-luastra-id="records/items"]');
        const anchor = document.querySelector('[data-luastra-id="records/items/record-101"]');
        return { first: document.querySelector('[data-luastra-id="records/first"]')?.textContent, error: document.querySelector('#error')?.textContent, innerHeight, scrollY, scrollHeight: document.documentElement.scrollHeight, listRect: list?.getBoundingClientRect().toJSON(), anchorRect: anchor?.getBoundingClientRect().toJSON(), diagnostics: window.__luastraDiagnostics?.snapshot() };
      })()`);
      throw new Error(`${error.message}: ${JSON.stringify(debug)}`);
    }
    await waitFor(client, "window.__luastraDiagnostics.snapshot().windowedLists[0].realizedItems < 50", "settled bounded window");
    await evaluate(client, `new Promise((accept) => setTimeout(accept, 100))`);
    await evaluate(client, `new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)))`);
    const evictionAnchorAfter = await evaluate(client, `document.querySelector('[data-luastra-id="records/items/record-101"]')?.getBoundingClientRect().top ?? null`);

    const remeasurement = await evaluate(client, `(async () => {
      document.documentElement.style.overflowAnchor = "none";
      document.body.style.overflowAnchor = "none";
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      const anchorIndex = connected.findIndex((node) => node.getBoundingClientRect().top >= 0);
      const anchor = connected[Math.max(1, anchorIndex)];
      const changed = connected[Math.max(0, connected.indexOf(anchor) - 2)];
      changed.style.minHeight = (changed.getBoundingClientRect().height + 1) + "px";
      changed.dispatchEvent(new Event("load", { bubbles: true }));
      await new Promise((accept) => setTimeout(accept, 100));
      await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)));
      const before = anchor.getBoundingClientRect().top;
      const scrollBefore = scrollY;
      changed.style.minHeight = (changed.getBoundingClientRect().height + 120) + "px";
      changed.dispatchEvent(new Event("load", { bubbles: true }));
      await new Promise((accept) => setTimeout(accept, 100));
      await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)));
      return { id: anchor.dataset.luastraId, changedId: changed.dataset.luastraId, before, after: anchor.getBoundingClientRect().top, scrollBefore, scrollAfter: scrollY };
    })()`);

    const delayedImage = await evaluate(client, `(async () => {
      const settle = () => new Promise((accept) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(accept)), 120));
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      const firstVisible = connected.findIndex((node) => node.getBoundingClientRect().top >= 0);
      const anchorIndex = Math.max(2, firstVisible);
      const anchor = connected[anchorIndex];
      const changed = connected[anchorIndex - 2];
      const before = anchor.getBoundingClientRect().top;
      const heightBefore = changed.getBoundingClientRect().height;
      const image = new Image();
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.decoding = "async";
      image.style.width = "144px";
      changed.append(image);
      await new Promise((accept) => setTimeout(accept, 75));
      const loaded = new Promise((accept, reject) => {
        image.addEventListener("load", accept, { once: true });
        image.addEventListener("error", () => reject(new Error("delayed image failed")), { once: true });
      });
      image.src = "/brand/luastra-mark.svg?windowed-list-delayed-image=1";
      await loaded;
      await image.decode();
      await settle();
      return {
        anchorId: anchor.dataset.luastraId,
        before,
        after: anchor.getBoundingClientRect().top,
        changedId: changed.dataset.luastraId,
        decoded: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
        heightBefore,
        heightAfter: changed.getBoundingClientRect().height,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    })()`);

    const textWrap = await evaluate(client, `(async () => {
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      const firstVisible = connected.findIndex((node) => node.getBoundingClientRect().top >= 0);
      const anchorIndex = Math.max(2, firstVisible);
      const anchor = connected[anchorIndex];
      const changed = connected[anchorIndex - 2];
      const button = changed.querySelector("button");
      const before = anchor.getBoundingClientRect().top;
      const heightBefore = changed.getBoundingClientRect().height;
      button.textContent = "A deliberately long reusable record label ".repeat(24);
      await new Promise((accept) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(accept)), 120));
      return {
        anchorId: anchor.dataset.luastraId,
        before,
        after: anchor.getBoundingClientRect().top,
        changedId: changed.dataset.luastraId,
        heightBefore,
        heightAfter: changed.getBoundingClientRect().height,
      };
    })()`);

    const fontAndScaling = await evaluate(client, `(async () => {
      const settle = () => new Promise((accept) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(accept)), 150));
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      const anchor = connected.find((node) => node.getBoundingClientRect().bottom > 0);
      const buttons = connected.map((node) => node.querySelector("button")).filter(Boolean);
      const family = "LuastraSlice3DelayedFont";
      const face = new FontFace(family, 'url("/assets/windowed-list-slice3.woff2") format("woff2")');
      const fontBefore = anchor.getBoundingClientRect().top;
      document.fonts.add(face);
      for (const button of buttons) button.style.fontFamily = family + ", sans-serif";
      await face.load();
      await document.fonts.ready;
      await settle();
      const fontAfter = anchor.getBoundingClientRect().top;
      const scaleBefore = anchor.getBoundingClientRect().top;
      const sizeBefore = Number.parseFloat(getComputedStyle(anchor.querySelector("button")).fontSize);
      list.style.fontSize = "200%";
      await settle();
      const sizeAfter = Number.parseFloat(getComputedStyle(anchor.querySelector("button")).fontSize);
      return {
        anchorId: anchor.dataset.luastraId,
        family: getComputedStyle(anchor.querySelector("button")).fontFamily,
        fontStatus: face.status,
        fontBefore,
        fontAfter,
        scaleBefore,
        scaleAfter: anchor.getBoundingClientRect().top,
        sizeBefore,
        sizeAfter,
      };
    })()`);

    await evaluate(client, `document.querySelector('[data-luastra-id="records/cycle"]').focus({ preventScroll: true })`);
    await pressKey(client, { code: "Tab", key: "Tab", keyCode: 9 });
    await evaluate(client, `new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)))`);
    const keyboardEntry = await evaluate(client, `(() => ({
      activeId: document.activeElement?.dataset?.luastraId ?? null,
      itemId: document.activeElement?.closest?.('li[data-luastra-id]')?.dataset?.luastraId ?? null,
      tagName: document.activeElement?.tagName ?? null,
    }))()`);
    await pressKey(client, { code: "Space", key: " ", keyCode: 32 });
    try {
      await waitFor(client, "document.querySelector('[data-luastra-id=\"records/announcement\"]')?.textContent?.startsWith('Selected record ')", "keyboard selection announcement");
    } catch (error) {
      const keyboardDebug = await evaluate(client, `(() => ({
        announcement: document.querySelector('[data-luastra-id="records/announcement"]')?.textContent ?? null,
        activeId: document.activeElement?.dataset?.luastraId ?? null,
        activeTag: document.activeElement?.tagName ?? null,
        keyboardEntry: ${JSON.stringify(keyboardEntry)},
      }))()`);
      throw new Error(`${error.message}: ${JSON.stringify(keyboardDebug)}`);
    }

    const focusPreparation = await evaluate(client, `(() => {
      const expected = document.querySelector('[data-luastra-id=${JSON.stringify(keyboardEntry.activeId)}]');
      const activeBefore = document.activeElement?.dataset?.luastraId ?? null;
      return { activeBefore, expectedConnected: expected?.isConnected === true };
    })()`);

    const focusPin = await evaluate(client, `(async () => {
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const active = document.querySelector('[data-luastra-id=${JSON.stringify(keyboardEntry.activeId)}]');
      const node = active?.closest('li[data-luastra-id]');
      if (!active || !node) throw new Error("keyboard-focused item was not retained after activation");
      active.focus({ preventScroll: true });
      const id = node.dataset.luastraId;
      scrollBy(0, 2200);
      await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(accept))));
      const connected = [...list.children].filter((item) => item.dataset.luastraId);
      const result = {
        id,
        activeId: document.activeElement?.dataset?.luastraId ?? null,
        activeItemId: document.activeElement?.closest?.('li[data-luastra-id]')?.dataset?.luastraId ?? null,
        connected: node.isConnected,
        connectedItems: connected.length,
        spacerCount: list.querySelectorAll(':scope > .luastra-window-spacer').length,
      };
      return result;
    })()`);

    await client.send("Accessibility.enable");
    const accessibilityDomOrder = await evaluate(client, `[...document.querySelector('[data-luastra-id="records/items"]').children]
      .filter((node) => node.dataset.luastraId)
      .map((node) => node.querySelector("button")?.textContent ?? null)`);
    const accessibilityTree = accessibilitySample((await client.send("Accessibility.getFullAXTree")).nodes);

    const browserBack = await evaluate(client, `(async () => {
      const before = new URL(location.href);
      const pushed = new URL(location.href);
      pushed.searchParams.set("windowedBackProbe", "1");
      history.pushState({ windowedListProbe: true }, "", pushed);
      const popped = new Promise((accept) => addEventListener("popstate", () => accept(true), { once: true }));
      history.back();
      const completed = await Promise.race([popped, new Promise((accept) => setTimeout(() => accept(false), 1000))]);
      await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)));
      const list = document.querySelector('[data-luastra-id="records/items"]');
      return {
        completed,
        restoredUrl: location.href === before.href,
        listConnected: list?.isConnected === true,
        windowState: list?.dataset?.luastraListWindowState ?? null,
        realizedItems: window.__luastraDiagnostics.snapshot().windowedLists[0].realizedItems,
      };
    })()`);

    await evaluate(client, `(() => { document.activeElement?.blur?.(); window.dispatchEvent(new Event("scroll")); })()`);
    await evaluate(client, `new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)))`);

    const resizeAnchor = await evaluate(client, `(() => {
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const node = [...list.children].find((item) => item.dataset.luastraId && item.getBoundingClientRect().top >= 0);
      node.tabIndex = -1;
      node.focus();
      return { id: node.dataset.luastraId, top: node.getBoundingClientRect().top, scrollY, listTop: list.getBoundingClientRect().top, documentHeight: document.documentElement.scrollHeight };
    })()`);
    await evaluate(client, `(() => { document.getElementById("host-root").style.width = "620px"; window.dispatchEvent(new Event("resize")); window.dispatchEvent(new Event("orientationchange")); })()`);
    await evaluate(client, `new Promise((accept) => setTimeout(accept, 100))`);
    await evaluate(client, `new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(accept))))`);
    const resizeAnchorAfter = await evaluate(client, `document.querySelector('[data-luastra-id="${resizeAnchor.id}"]')?.getBoundingClientRect().top ?? null`);
    await evaluate(client, `(() => { document.activeElement?.blur?.(); window.dispatchEvent(new Event("scroll")); })()`);
    await evaluate(client, `new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)))`);
    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await client.send("Emulation.setDeviceMetricsOverride", { width: 640, height: 520, deviceScaleFactor: 1, mobile: false });
    await evaluate(client, `new Promise((accept) => setTimeout(accept, 100))`);

    const sample = await evaluate(client, `(() => {
      const list = document.querySelector('[data-luastra-id="records/items"]');
      const connected = [...list.children].filter((node) => node.dataset.luastraId);
      return {
        preview: window.__luastraPreview,
        diagnostics: window.__luastraDiagnostics.snapshot(),
        windowState: list.dataset.luastraListWindowState,
        directChildren: list.children.length,
        connectedItems: connected.length,
        spacerCount: list.querySelectorAll(':scope > .luastra-window-spacer').length,
        firstPosition: connected[0]?.getAttribute("aria-posinset") ?? null,
        setSize: connected[0]?.getAttribute("aria-setsize") ?? null,
        anchorAfter: ${JSON.stringify(evictionAnchorAfter)},
        resizeAnchorAfter: ${JSON.stringify(resizeAnchorAfter)},
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        activeListAnimations: list.getAnimations({ subtree: true }).map((animation) => animation.animationName ?? animation.constructor.name),
        resizeAfter: { scrollY, listTop: list.getBoundingClientRect().top, documentHeight: document.documentElement.scrollHeight, firstConnectedId: connected[0]?.dataset?.luastraId ?? null, lastConnectedId: connected.at(-1)?.dataset?.luastraId ?? null },
      };
    })()`);
    const listDiagnostics = sample.diagnostics.windowedLists[0];
    const assertions = {
      previewPass: sample.preview.result === "PASS",
      windowed: sample.windowState === "windowed",
      boundedDom: sample.connectedItems === listDiagnostics.realizedItems && sample.connectedItems < 50,
      twoSpacers: sample.spacerCount === 2 && sample.directChildren === sample.connectedItems + 2,
      boundedMeasurements: listDiagnostics.measuredItems <= 300,
      retainedCollection: listDiagnostics.retainedItems === 300,
      logicalTotal: sample.setSize === "100000",
      logicalPosition: Number(sample.firstPosition) >= 1,
      anchorStable: Number.isFinite(evictionAnchorAfter) && Math.abs(evictionAnchorAfter - anchorBefore) <= 2,
      remeasurementAnchorStable: Math.abs(remeasurement.after - remeasurement.before) <= 2,
      boundedFocusPin: focusPin.activeId === keyboardEntry.activeId && focusPin.activeItemId === focusPin.id && focusPin.connected && focusPin.connectedItems < 50 && focusPin.spacerCount === 3,
      layoutResizeAnchorStable: Number.isFinite(resizeAnchorAfter) && Math.abs(resizeAnchorAfter - resizeAnchor.top) <= 2,
      reducedMotionStable: sample.reducedMotion && sample.diagnostics.activeMotionCount === 0 && sample.diagnostics.activeFrameTaskCount === 0,
      delayedImageAnchorStable: delayedImage.decoded && delayedImage.heightAfter > delayedImage.heightBefore && Math.abs(delayedImage.after - delayedImage.before) <= 2,
      textWrapAnchorStable: textWrap.heightAfter > textWrap.heightBefore && Math.abs(textWrap.after - textWrap.before) <= 2,
      fontLoadAnchorStable: delayedFontRequests === 1 && delayedFontError === null && fontAndScaling.fontStatus === "loaded" && fontAndScaling.family.startsWith("LuastraSlice3DelayedFont") && Math.abs(fontAndScaling.fontAfter - fontAndScaling.fontBefore) <= 2,
      fontScalingAnchorStable: fontAndScaling.sizeAfter >= fontAndScaling.sizeBefore * 1.9 && Math.abs(fontAndScaling.scaleAfter - fontAndScaling.scaleBefore) <= 2,
      keyboardFocusAndAnnouncement: keyboardEntry.tagName === "BUTTON" && keyboardEntry.activeId?.endsWith("/open") && keyboardEntry.itemId !== null && focusPreparation.activeBefore === keyboardEntry.activeId && focusPreparation.expectedConnected && accessibilityTree.statusLive === "polite" && accessibilityTree.statusText?.includes("Selected record "),
      accessibilityTreeOrder: accessibilityTree.listRole === "list" && accessibilityTree.listIgnored === false && accessibilityTree.itemNames.length > 0 && JSON.stringify(accessibilityTree.itemNames) === JSON.stringify(accessibilityDomOrder),
      browserBackPreservesList: browserBack.completed && browserBack.restoredUrl && browserBack.listConnected && browserBack.windowState === "windowed" && browserBack.realizedItems < 50,
    };
    const report = {
      schemaVersion: 1,
      evidenceClass: "REAL_CHROMIUM_WINDOWED_LIST",
      browser: "Google Chrome headless via CDP",
      project: "dev.luastra.state-foundations",
      assertions,
      sample: { ...sample, remeasurement, delayedImage, textWrap, delayedFontRequests, delayedFontError, fontAndScaling, keyboardEntry, focusPreparation, focusPin, accessibilityDomOrder, accessibilityTree, browserBack, resizeAnchor },
      result: Object.values(assertions).every(Boolean) ? "PASS" : "FAIL",
      boundary: "This gate covers Chromium DOM windowing, backward edge reload, actual delayed image decode and delayed same-origin WOFF2 FontFace loading, text wrapping, 200% list text, keyboard focus, browser accessibility-tree order and live-region semantics, browser Back, disjoint focus pinning, layout-width and orientation reflow, bounded viewport resizing, reduced-motion stability, and anchor tolerance. The accessibility tree is the browser interface consumed by assistive technology; this is not an owner-observed VoiceOver or NVDA session. Native-shell windowing and low-end physical-device performance remain separate claims.",
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.result !== "PASS") process.exitCode = 1;
  } finally {
    client?.close();
    browser.kill("SIGTERM");
    await application.close();
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error?.stack ?? error)}\n`);
  process.exitCode = 1;
});
