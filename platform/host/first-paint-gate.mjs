export function waitForFirstPaint(requestFrame = globalThis.requestAnimationFrame) {
  if (typeof requestFrame !== "function") throw new Error("first-paint gate requires requestAnimationFrame");
  return new Promise((accept) => {
    requestFrame(() => requestFrame(accept));
  });
}
