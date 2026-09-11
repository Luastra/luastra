export function waitForFirstPaint(requestFrame = globalThis.requestAnimationFrame, {
  timeoutMs = null,
  scheduleTimeout = globalThis.setTimeout,
  cancelTimeout = globalThis.clearTimeout,
} = {}) {
  if (typeof requestFrame !== "function") throw new Error("first-paint gate requires requestAnimationFrame");
  if (timeoutMs !== null && (!Number.isInteger(timeoutMs) || timeoutMs < 1 || typeof scheduleTimeout !== "function" || typeof cancelTimeout !== "function")) {
    throw new Error("first-paint fallback is invalid");
  }
  return new Promise((accept) => {
    let settled = false;
    let timeout = null;
    const complete = () => {
      if (settled) return;
      settled = true;
      if (timeout !== null) cancelTimeout(timeout);
      accept();
    };
    if (timeoutMs !== null) timeout = scheduleTimeout(complete, timeoutMs);
    requestFrame(() => requestFrame(complete));
  });
}
