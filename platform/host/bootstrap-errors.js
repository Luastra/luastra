(function installLuastraBootstrapErrorBoundary(global) {
  var maximumErrors = 8;
  var maximumMessageLength = 2048;
  global.__luastraBootstrapErrors = [];

  function failStartup() {
    var startup = document.querySelector('[data-luastra-startup-host="v1"]');
    if (!startup) return false;
    if (startup.getAttribute("data-startup-state") !== "failed") {
      startup.setAttribute("data-startup-state", "failed");
      var panel = startup.querySelector("[data-startup-failure]");
      if (panel) panel.focus();
    }
    return true;
  }
  global.__luastraFailStartup = failStartup;
  document.addEventListener("click", function retryStartup(event) {
    var button = event.target && event.target.closest && event.target.closest("[data-startup-retry]");
    if (!button || !button.closest('[data-luastra-startup-host="v1"][data-startup-state="failed"]')) return;
    button.disabled = true;
    button.textContent = "Trying again…";
    global.location.reload();
  });

  function report(value) {
    var startupFailed = failStartup();
    var message = String(value && (value.stack || value.message) || value || "Unknown bootstrap failure").slice(0, maximumMessageLength);
    if (global.__luastraBootstrapErrors.length >= maximumErrors) return;
    global.__luastraBootstrapErrors.push(message);
    var status = document.querySelector("#status");
    var output = document.querySelector("#error");
    if (status) {
      status.hidden = startupFailed;
      status.textContent = "Luastra preview failed";
      status.classList.add("fail");
    }
    if (output) {
      output.hidden = startupFailed;
      output.textContent = global.__luastraBootstrapErrors.join("\n\n");
    }
    global.__luastraPreview = { result: "FAIL", stage: "bootstrap", error: message };
  }

  global.addEventListener("error", function onBootstrapError(event) {
    if (event.error || event.message) report(event.error || event.message);
    else if (event.target && event.target.tagName === "SCRIPT") report("Failed to load script: " + event.target.src);
  }, true);
  global.addEventListener("unhandledrejection", function onBootstrapRejection(event) {
    report(event.reason);
  });
}(window));
