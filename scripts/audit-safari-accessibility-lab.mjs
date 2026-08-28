import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runProject } from "../project/run-project.mjs";

function fail(message) {
  throw new Error(message);
}

function delay(milliseconds) {
  return new Promise((accept) => setTimeout(accept, milliseconds));
}

function parseArguments(values) {
  const result = {
    driverPort: 4446,
    output: null,
    port: 4194,
    project: "test-fixtures/accessibility-lab/luastra.json",
  };
  for (const value of values) {
    const [name, raw] = value.split("=", 2);
    if (name === "--driver-port") result.driverPort = Number(raw);
    else if (name === "--out") result.output = raw;
    else if (name === "--port") result.port = Number(raw);
    else if (name === "--project") result.project = raw;
    else fail(`unknown option: ${value}`);
  }
  for (const [name, value] of [["driver-port", result.driverPort], ["port", result.port]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) fail(`invalid --${name}`);
  }
  if (!result.project) fail("invalid --project");
  if (result.output !== null && !result.output) fail("invalid --out");
  return result;
}

async function webdriver(base, method, path, body) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    fail(`WebDriver ${method} ${path} transport failed: ${String(error)}`);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.value?.error) fail(`WebDriver ${method} ${path} failed: ${JSON.stringify(payload)}`);
  return payload?.value;
}

async function waitForDriver(base, process) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) fail(`SafariDriver exited before readiness (${process.exitCode})`);
    const response = await fetch(`${base}/status`).catch(() => null);
    if (response?.ok) return;
    await delay(100);
  }
  fail("SafariDriver readiness timeout");
}

async function execute(base, sessionId, script, args = []) {
  return webdriver(base, "POST", `/session/${sessionId}/execute/sync`, { script, args });
}

function elementId(value) {
  return value?.["element-6066-11e4-a52e-4f735466cecf"] ?? fail("WebDriver did not return an element id");
}

async function click(base, sessionId, selector) {
  const clicked = await execute(base, sessionId, `
    const node = document.querySelector(arguments[0]);
    if (!node) return false;
    node.click();
    return true;
  `, [selector]);
  if (!clicked) fail(`missing click target: ${selector}`);
}

async function sendKeys(base, sessionId, selector, text) {
  const focused = await execute(base, sessionId, `
    const node = document.querySelector(arguments[0]);
    if (!node) return false;
    node.focus({ preventScroll: true });
    return document.activeElement === node;
  `, [selector]);
  if (!focused) fail(`missing key target: ${selector}`);
  await sendActiveKeys(base, sessionId, text);
}

async function sendActiveKeys(base, sessionId, text) {
  const active = await webdriver(base, "GET", `/session/${sessionId}/element/active`);
  await webdriver(base, "POST", `/session/${sessionId}/element/${elementId(active)}/value`, { text, value: [...text] });
}

async function sendKeyChord(base, sessionId, modifier, key) {
  await webdriver(base, "POST", `/session/${sessionId}/actions`, {
    actions: [{
      type: "key",
      id: "keyboard-chord",
      actions: [
        { type: "keyDown", value: modifier },
        { type: "keyDown", value: key },
        { type: "keyUp", value: key },
        { type: "keyUp", value: modifier },
      ],
    }],
  });
  await webdriver(base, "DELETE", `/session/${sessionId}/actions`);
}

async function waitFor(base, sessionId, script, description) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await execute(base, sessionId, script)) return;
    await delay(50);
  }
  fail(`timeout waiting for ${description}`);
}

const layoutScript = `
  const visible = (node) => node && !node.hidden && node.getClientRects().length > 0;
  const actions = [...document.querySelectorAll('button, input, select, textarea, a[href]')].filter(visible);
  return {
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    devicePixelRatio: window.devicePixelRatio,
    visualViewportWidth: window.visualViewport?.width ?? null,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    minimumTarget: actions.reduce((minimum, node) => Math.min(minimum, node.getBoundingClientRect().height, node.getBoundingClientRect().width), Infinity),
    actions: actions.map((node) => ({ id: node.id, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })),
  };
`;

async function main() {
  if (process.platform !== "darwin") fail("Safari accessibility audit requires macOS");
  const options = parseArguments(process.argv.slice(2));
  const prototype = resolve(import.meta.dirname, "..");
  const applicationEvents = [];
  const application = await runProject({
    manifestPath: resolve(prototype, options.project),
    port: options.port,
    watch: false,
    onEvent: (event) => applicationEvents.push(event),
  });
  const driver = spawn("/usr/bin/safaridriver", ["-p", String(options.driverPort)], { stdio: ["ignore", "pipe", "pipe"] });
  let driverOutput = "";
  driver.stdout.on("data", (value) => { driverOutput += value; });
  driver.stderr.on("data", (value) => { driverOutput += value; });
  const base = `http://127.0.0.1:${options.driverPort}`;
  let sessionId = null;
  try {
    await waitForDriver(base, driver);
    const created = await webdriver(base, "POST", "/session", { capabilities: { alwaysMatch: { browserName: "safari" } } });
    sessionId = created?.sessionId ?? fail("SafariDriver did not return a session id");
    await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width: 1024, height: 850, x: 30, y: 30 });
    const url = `${application.url}?luastraDiagnostics=1`;
    await webdriver(base, "POST", `/session/${sessionId}/url`, { url });
    await waitFor(base, sessionId, "return window.__luastraPreview?.result === 'PASS'", "Luastra preview PASS");

    await execute(base, sessionId, `
      window.__luastraSafariAudit = { errors: [] };
      window.addEventListener('error', (event) => window.__luastraSafariAudit.errors.push(String(event.error?.message ?? event.message ?? 'error')));
      window.addEventListener('unhandledrejection', (event) => window.__luastraSafariAudit.errors.push(String(event.reason?.message ?? event.reason ?? 'unhandled rejection')));
    `);

    const semantics = await execute(base, sessionId, `
      const visible = (node) => node && !node.hidden && node.getClientRects().length > 0;
      const input = (id) => {
        const node = document.getElementById(id);
        return {
          id,
          label: node?.getAttribute('aria-label'),
          required: node?.required,
          invalid: node?.getAttribute('aria-invalid'),
          describedBy: node?.getAttribute('aria-describedby'),
          inputMode: node?.inputMode,
          enterKeyHint: node?.enterKeyHint,
          autoComplete: node?.autocomplete,
        };
      };
      return {
        mains: [...document.querySelectorAll('main')].filter(visible).length,
        headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map((node) => ({ level: Number(node.tagName.slice(1)), text: node.textContent })),
        status: [...document.querySelectorAll('[role=status]')].filter(visible).map((node) => node.textContent),
        dialogName: document.getElementById('accessibility/modal')?.getAttribute('aria-label'),
        inputs: [input('accessibility/name-input'), input('accessibility/email-input'), input('accessibility/composed-input'), input('accessibility/bottom-input')],
      };
    `);

    await execute(base, sessionId, "document.body.focus(); document.activeElement?.blur();");
    const focusOrder = [];
    for (let index = 0; index < 8; index += 1) {
      // Safari intentionally reserves plain Tab for text fields when the macOS
      // full-keyboard-access preference is disabled. Option+Tab is Safari's
      // documented per-session traversal of every web control.
      await sendKeyChord(base, sessionId, "\uE00A", "\uE004");
      focusOrder.push(await execute(base, sessionId, `
        const node = document.activeElement;
        const style = getComputedStyle(node);
        return { id: node?.id ?? '', outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset };
      `));
    }

    await click(base, sessionId, '[data-luastra-id="accessibility/validate"]');
    await waitFor(base, sessionId, "return document.getElementById('accessibility/status')?.textContent === 'Validation failed'", "invalid validation state");
    const invalidValidation = await execute(base, sessionId, `
      const email = document.getElementById('accessibility/email-input');
      const alert = document.getElementById('accessibility/email-error');
      return {
        status: document.getElementById('accessibility/status')?.textContent,
        statusRole: document.getElementById('accessibility/status')?.getAttribute('role'),
        alert: alert?.textContent,
        alertRole: alert?.getAttribute('role'),
        alertVisible: alert ? !alert.hidden && alert.getClientRects().length > 0 : false,
        emailInvalid: email?.getAttribute('aria-invalid'),
        emailDescribedBy: email?.getAttribute('aria-describedby'),
      };
    `);

    await sendKeys(base, sessionId, '[data-luastra-id="accessibility/email-input"]', "qa@example.com");
    await click(base, sessionId, '[data-luastra-id="accessibility/validate"]');
    await waitFor(base, sessionId, "return document.getElementById('accessibility/status')?.textContent === 'Validation passed'", "valid validation state");
    const validValidation = await execute(base, sessionId, `return {
      status: document.getElementById('accessibility/status')?.textContent,
      alertHidden: document.getElementById('accessibility/email-error')?.hidden,
      emailInvalid: document.getElementById('accessibility/email-input')?.getAttribute('aria-invalid'),
      emailDescribedBy: document.getElementById('accessibility/email-input')?.getAttribute('aria-describedby'),
    }`);

    await click(base, sessionId, '[data-luastra-id="accessibility/email-input"]');
    await sendActiveKeys(base, sessionId, "\uE007");
    await waitFor(base, sessionId, "return document.activeElement?.id === 'accessibility/composed-input'", "Next focus transfer");
    const nextAction = await execute(base, sessionId, `return {
      activeId: document.activeElement?.id,
      activeTag: document.activeElement?.tagName,
    }`);
    await sendActiveKeys(base, sessionId, "\uE007");
    await waitFor(base, sessionId, "return document.activeElement?.id !== 'accessibility/composed-input'", "Done editing dismissal");
    const doneAction = await execute(base, sessionId, `return {
      activeId: document.activeElement?.id ?? '',
      activeTag: document.activeElement?.tagName,
    }`);

    await execute(base, sessionId, "document.getElementById('accessibility/open-modal').focus({ preventScroll: true })");
    await sendActiveKeys(base, sessionId, "\uE007");
    await waitFor(base, sessionId, "return document.getElementById('accessibility/modal')?.open === true", "modal open");
    const modalOpen = await execute(base, sessionId, `return {
      open: document.getElementById('accessibility/modal')?.open,
      activeId: document.activeElement?.id,
      activeInside: document.getElementById('accessibility/modal')?.contains(document.activeElement),
      bodyInertByNativeModal: document.querySelector('dialog:modal')?.id === 'accessibility/modal',
    }`);
    await sendActiveKeys(base, sessionId, "\uE004");
    const modalAfterTab = await execute(base, sessionId, `return {
      activeId: document.activeElement?.id,
      activeInside: document.getElementById('accessibility/modal')?.contains(document.activeElement),
    }`);
    await sendActiveKeys(base, sessionId, "\uE00C");
    await waitFor(base, sessionId, "return document.getElementById('accessibility/modal')?.open === false", "modal Escape dismissal");
    const modalClosed = await execute(base, sessionId, `return {
      open: document.getElementById('accessibility/modal')?.open,
      status: document.getElementById('accessibility/status')?.textContent,
      activeId: document.activeElement?.id,
    }`);

    const responsive = [];
    for (const width of [320, 390, 768, 1024, 1440]) {
      await webdriver(base, "POST", `/session/${sessionId}/window/rect`, { width, height: 850, x: 20, y: 20 });
      await delay(100);
      responsive.push({ width, value: await execute(base, sessionId, layoutScript) });
    }

    const errors = await execute(base, sessionId, "return [...window.__luastraSafariAudit.errors]");
    const assertions = {
      exactlyOneMain: semantics.mains === 1,
      logicalHeadingOrder: semantics.headings.length >= 3 && semantics.headings[0].level === 1 && semantics.headings.slice(1).every((heading) => heading.level === 2),
      labelledInputs: semantics.inputs.every((input) => input.label),
      keyboardHints: semantics.inputs.map((input) => input.enterKeyHint).join(",") === "next,next,done,done",
      focusOrder: ["accessibility/name-input", "accessibility/email-input", "accessibility/composed-input", "accessibility/validate", "accessibility/open-modal", "accessibility/bottom-input"].every((id, index) => focusOrder[index]?.id === id),
      focusVisible: focusOrder.slice(0, 6).every((item) => item.outlineStyle !== "none" && Number.parseFloat(item.outlineWidth) >= 2),
      invalidStateLinked: invalidValidation.statusRole === "status" && invalidValidation.alertRole === "alert" && invalidValidation.alertVisible && invalidValidation.emailInvalid === "true" && invalidValidation.emailDescribedBy === "accessibility/email-error",
      validStateClearsError: validValidation.status === "Validation passed" && validValidation.alertHidden === true && validValidation.emailInvalid !== "true" && !validValidation.emailDescribedBy,
      nextFocusTransfer: nextAction.activeId === "accessibility/composed-input",
      doneEditingDismissal: doneAction.activeId !== "accessibility/composed-input",
      modalBoundary: modalOpen.open && modalOpen.activeInside && modalOpen.bodyInertByNativeModal && modalAfterTab.activeInside,
      modalEscapeAndReturn: !modalClosed.open && modalClosed.status === "Information closed" && modalClosed.activeId === "accessibility/open-modal",
      responsiveNoOverflow: responsive.every((sample) => sample.value.horizontalOverflow === 0),
      responsiveTargets: responsive.every((sample) => sample.value.minimumTarget >= 44),
      noErrors: errors.length === 0,
    };
    const result = Object.values(assertions).every(Boolean) ? "PASS" : "FAIL";
    const report = {
      schemaVersion: 1,
      blocker: 10,
      evidenceClass: "REAL_SAFARI_KEYBOARD_LAYOUT",
      startedAt: new Date().toISOString(),
      browser: "Safari via Apple SafariDriver",
      project: "dev.luastra.accessibility-lab",
      url,
      applicationEvents,
      semantics,
      focusOrder,
      invalidValidation,
      validValidation,
      editingActions: { next: nextAction, done: doneAction },
      modal: { open: modalOpen, afterTab: modalAfterTab, closed: modalClosed },
      responsive,
      errors,
      assertions,
      result,
      boundary: "This is real Safari/WebKit keyboard, DOM, responsive-layout and native-dialog evidence. Browser zoom, VoiceOver announcements, real software-keyboard composition, physical-device evidence and system Reduce Motion are retained as separate observations.",
    };
    const reportText = `${JSON.stringify(report, null, 2)}\n`;
    if (options.output !== null) {
      const output = resolve(options.output);
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, reportText);
    }
    process.stdout.write(reportText);
    if (result !== "PASS") process.exitCode = 1;
  } finally {
    if (sessionId) await webdriver(base, "DELETE", `/session/${sessionId}`).catch(() => {});
    driver.kill("SIGTERM");
    await application.close();
    if (driverOutput.trim()) process.stderr.write(driverOutput);
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error?.stack ?? error)}\n`);
  process.exitCode = 1;
});
