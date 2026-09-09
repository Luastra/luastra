// Only presentation crosses the frame boundary; Luastra owns example state and events.
(() => {
  const report = () => {
    const root = document.getElementById("host-root");
    if (!root || !document.getElementById("example/root")) return;
    parent.postMessage({ type: "luastra-example-ready", height: Math.ceil(root.getBoundingClientRect().height) }, location.origin);
  };
  addEventListener("message", event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== "luastra-example-theme") return;
    for (const [name, value] of Object.entries(event.data.colors ?? {})) {
      if (/^--luastra-color-[a-z-]+$/.test(name) && typeof value === "string" && value.length < 100) document.documentElement.style.setProperty(name, value);
    }
  });
  const observer = new MutationObserver(report);
  observer.observe(document.getElementById("host-root"), { childList: true, subtree: true });
  new ResizeObserver(report).observe(document.getElementById("host-root"));
})();
