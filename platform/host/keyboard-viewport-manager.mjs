const editableSelector = "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable='true']";

function editable(element, root) {
  return element && root.contains(element) && element.matches?.(editableSelector);
}

export function createKeyboardViewportManager({
  windowTarget = window,
  documentTarget = document,
  root,
  margin = 16,
} = {}) {
  if (!root?.addEventListener || !root?.contains) throw new Error("keyboard viewport root is required");
  if (!Number.isFinite(margin) || margin < 0 || margin > 128) throw new Error("keyboard viewport margin is invalid");

  const viewport = windowTarget.visualViewport ?? null;
  let frame = null;
  let active = null;

  const cancel = () => {
    if (frame !== null) windowTarget.cancelAnimationFrame(frame);
    frame = null;
  };

  const ensureVisible = () => {
    frame = null;
    if (!editable(active, root) || documentTarget.activeElement !== active) return;
    const bounds = active.getBoundingClientRect();
    const top = (viewport?.offsetTop ?? 0) + margin;
    const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? windowTarget.innerHeight) - margin;
    let delta = 0;
    if (bounds.bottom > bottom) delta = bounds.bottom - bottom;
    else if (bounds.top < top) delta = bounds.top - top;
    if (Math.abs(delta) < 1) return;
    windowTarget.scrollBy({ top: delta, left: 0, behavior: "auto" });
  };

  const schedule = () => {
    if (!editable(active, root)) return;
    cancel();
    frame = windowTarget.requestAnimationFrame(ensureVisible);
  };
  const focusIn = (event) => {
    active = editable(event.target, root) ? event.target : null;
    schedule();
  };
  const focusOut = (event) => {
    if (event.target === active) active = null;
    cancel();
  };

  root.addEventListener("focusin", focusIn);
  root.addEventListener("focusout", focusOut);
  viewport?.addEventListener("resize", schedule);
  viewport?.addEventListener("scroll", schedule);
  windowTarget.addEventListener("resize", schedule);

  return Object.freeze({
    check: schedule,
    dispose() {
      cancel();
      active = null;
      root.removeEventListener("focusin", focusIn);
      root.removeEventListener("focusout", focusOut);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      windowTarget.removeEventListener("resize", schedule);
    },
  });
}
