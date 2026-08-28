(function installLuastraBootstrapErrorBoundary(global) {
  var maximumErrors = 8;
  var maximumMessageLength = 2048;
  global.__luastraBootstrapErrors = [];

  function report(value) {
    var message = String(value && (value.stack || value.message) || value || "Unknown bootstrap failure").slice(0, maximumMessageLength);
    if (global.__luastraBootstrapErrors.length >= maximumErrors) return;
    global.__luastraBootstrapErrors.push(message);
    var status = document.querySelector("#status");
    var output = document.querySelector("#error");
    if (status) {
      status.hidden = false;
      status.textContent = "Luastra preview failed";
      status.classList.add("fail");
    }
    if (output) {
      output.hidden = false;
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
