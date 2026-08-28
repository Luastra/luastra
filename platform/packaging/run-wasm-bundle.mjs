#!/usr/bin/env node

import { performance } from "node:perf_hooks";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

import { verifyBundle } from "./run-bundle.mjs";
import {
  Protocol,
  validateCapabilityRequest,
  validateCapabilityResponse,
  validateRendererTree,
  validateRpcResponse,
} from "../protocol/generated/protocol.mjs";
import { RequestLedger } from "../protocol/request-ledger.mjs";

function fail(message) {
  throw new Error(message);
}

export async function runWasmBundle({
  bundlePath,
  runtimeModulePath,
  allowedCapabilities = [],
  supportedProtocol = 1,
  cycles = 1,
  requireRendererTree = false,
  dispatches = [],
  capabilityHandler = null,
}) {
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 1000) {
    fail("cycles must be an integer from 1 to 1000");
  }

  const absoluteRuntimeModule = resolve(runtimeModulePath);
  const runtimeDirectory = dirname(absoluteRuntimeModule);
  const initializationStarted = performance.now();
  const { default: createRuntime } = await import(pathToFileURL(absoluteRuntimeModule).href);
  const runtime = await createRuntime({
    locateFile(fileName) {
      return join(runtimeDirectory, fileName);
    },
  });
  const initializationMs = performance.now() - initializationStarted;

  const version = runtime.cwrap("luastra_vm_wasm_version", "string", []);
  const memoryBytes = runtime.cwrap("luastra_vm_wasm_memory_bytes", "number", []);
  const createSession = runtime.cwrap("luastra_vm_session_create", "number", []);
  const addModule = runtime.cwrap("luastra_vm_session_add_module", "string", [
    "number",
    "string",
    "number",
    "number",
  ]);
  const allowCapability = runtime.cwrap("luastra_vm_session_allow_capability", "string", ["number", "string"]);
  const startSession = runtime.cwrap("luastra_vm_session_start", "string", ["number", "string"]);
  const startUiSession = runtime.cwrap("luastra_vm_session_start_ui", "string", ["number", "string"]);
  const dispatchSession = runtime.cwrap("luastra_vm_session_dispatch", "string", ["number", "string", "string", "string"]);
  const takeRequest = runtime.cwrap("luastra_vm_session_take_request", "string", ["number"]);
  const resolveRpc = runtime.cwrap("luastra_vm_session_resolve_rpc", "string", [
    "number", "number", "number", "string", "string", "string", "string",
  ]);
  const destroySession = runtime.cwrap("luastra_vm_session_destroy", "string", ["number"]);

  const vmIdentity = version();
  const { bundle, verifiedModules } = await verifyBundle({
    bundlePath,
    expectedVm: vmIdentity,
    allowedCapabilities,
    supportedProtocol,
  });

  const memoryBefore = memoryBytes();
  const cycleDurations = [];
  const interactionDurations = [];
  let maximumInteractionMemoryGrowthBytes = 0;
  let lastResult = null;
  const executionStarted = performance.now();

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const cycleStarted = performance.now();
    const handle = createSession();
    const ledger = new RequestLedger();
    if (!handle) fail(`VM refused session ${cycle + 1}`);
    try {
      for (const module of verifiedModules) {
        const pointer = runtime._malloc(module.bytecode.byteLength);
        if (!pointer) fail(`Wasm allocation failed for ${module.id}`);
        try {
          runtime.writeArrayToMemory(module.bytecode, pointer);
          const added = JSON.parse(addModule(handle, module.id, pointer, module.bytecode.byteLength));
          if (added.success !== true) fail(`VM rejected module ${module.id}: ${added.error}`);
        } finally {
          runtime._free(pointer);
        }
      }

      for (const capability of bundle.capabilities.filter((item) => Protocol.capability.requestKinds.includes(item))) {
        const allowed = JSON.parse(allowCapability(handle, capability));
        if (allowed.success !== true) fail(`VM rejected declared capability ${capability}: ${allowed.error}`);
      }

      lastResult = JSON.parse((requireRendererTree ? startUiSession : startSession)(handle, bundle.project.entry));
      if (lastResult.success !== true) fail(`VM execution failed: ${lastResult.error}`);
      if (requireRendererTree && !validateRendererTree(lastResult.renderTree)) fail("VM returned invalid semantic renderer tree");
      const processRequests = async () => {
        while (true) {
          const taken = JSON.parse(takeRequest(handle));
          if (taken.success !== true) fail(`VM request queue failed: ${taken.error}`);
          if (taken.request === null) return;
          if (!validateCapabilityRequest(taken.request)) fail("VM emitted invalid capability request");
          if (typeof capabilityHandler !== "function") fail(`VM emitted unhandled capability request: ${taken.request.kind}`);
          const startedAt = performance.now();
          const begun = ledger.begin(taken.request, startedAt);
          if (!begun.accepted) fail(`Host ledger rejected VM request: ${begun.reason}`);
          const handled = await capabilityHandler(taken.request);
          if (handled?.accepted !== true || !handled.response) {
            fail(`Capability handler rejected VM request: ${handled?.reason ?? "UNKNOWN"}`);
          }
          const response = handled.response;
          if (!validateCapabilityResponse(response)) fail("Capability handler returned an invalid response envelope");
          const settled = ledger.settle(response, performance.now());
          if (!settled.accepted) fail(`Host ledger rejected capability response: ${settled.reason}`);
          const rpc = taken.request.kind === "rpc.call" ? response.payload : null;
          if (taken.request.kind === "rpc.call" && (response.status !== "ok" || !validateRpcResponse(rpc, taken.request.traceId, taken.request.payload.operation))) {
            fail("Capability handler returned an invalid typed RPC response");
          }
          const success = response.status === "ok" && (rpc === null || rpc.success);
          const payload = rpc === null ? response.payload : (rpc.success ? (taken.request.payload.operation === "server.call.v1" ? rpc.data.payload : JSON.stringify(rpc.data)) : "");
          const error = rpc === null ? response.payload : rpc.error;
          lastResult = JSON.parse(resolveRpc(
            handle,
            taken.request.requestId,
            success ? 1 : 0,
            success ? payload : "",
            success ? "" : error.code,
            success ? "" : error.message,
            taken.request.traceId,
          ));
          if (lastResult.success !== true) fail(`VM rejected RPC response: ${lastResult.error}`);
          if (requireRendererTree && !validateRendererTree(lastResult.renderTree)) fail("VM RPC resolution returned invalid semantic renderer tree");
        }
      };
      await processRequests();
      const interactionMemoryBefore = memoryBytes();
      for (const event of dispatches) {
        const interactionStarted = performance.now();
        lastResult = JSON.parse(dispatchSession(handle, event.action, event.target, event.value ?? ""));
        if (lastResult.success !== true) fail(`VM event failed: ${lastResult.error}`);
        if (!validateRendererTree(lastResult.renderTree)) fail("VM event returned invalid semantic renderer tree");
        await processRequests();
        interactionDurations.push(performance.now() - interactionStarted);
      }
      maximumInteractionMemoryGrowthBytes = Math.max(maximumInteractionMemoryGrowthBytes, memoryBytes() - interactionMemoryBefore);
    } finally {
      ledger.dispose();
      const destroyed = JSON.parse(destroySession(handle));
      if (destroyed.success !== true) fail(`VM session disposal failed: ${destroyed.error}`);
    }
    cycleDurations.push(performance.now() - cycleStarted);
  }

  const executionMs = performance.now() - executionStarted;
  const memoryAfter = memoryBytes();
  const sortedDurations = [...cycleDurations].sort((left, right) => left - right);
  const percentile = (values, ratio) => values[Math.max(0, Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1))];
  const sortedInteractions = [...interactionDurations].sort((left, right) => left - right);

  return {
    success: true,
    vm: vmIdentity,
    modules: lastResult.modules,
    output: lastResult.output,
    contentSha256: bundle.contentSha256,
    cycles,
    timing: {
      initializationMs,
      executionMs,
      minimumCycleMs: sortedDurations[0],
      medianCycleMs: percentile(sortedDurations, 0.5),
      p95CycleMs: percentile(sortedDurations, 0.95),
      maximumCycleMs: sortedDurations.at(-1),
    },
    memory: {
      beforeBytes: memoryBefore,
      afterBytes: memoryAfter,
      growthBytes: memoryAfter - memoryBefore,
    },
    interaction: {
      count: interactionDurations.length,
      p95Ms: sortedInteractions.length === 0 ? 0 : percentile(sortedInteractions, 0.95),
      maximumMs: sortedInteractions.at(-1) ?? 0,
      maximumMemoryGrowthBytes: maximumInteractionMemoryGrowthBytes,
    },
    ...(requireRendererTree ? { renderTree: lastResult.renderTree, pendingRequests: lastResult.pendingRequests } : {}),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((argument) => {
      const separator = argument.indexOf("=");
      if (separator < 0) fail(`expected --name=value argument, got ${argument}`);
      return [argument.slice(0, separator), argument.slice(separator + 1)];
    }),
  );
  if (!args["--bundle"] || !args["--runtime"]) {
    fail("usage: run-wasm-bundle.mjs --bundle=<manifest> --runtime=<luastra-vm.js> [--allow=a,b] [--cycles=n]");
  }
  const result = await runWasmBundle({
    bundlePath: args["--bundle"],
    runtimeModulePath: args["--runtime"],
    allowedCapabilities: args["--allow"] ? args["--allow"].split(",").filter(Boolean) : [],
    supportedProtocol: args["--protocol"] ? Number(args["--protocol"]) : 1,
    cycles: args["--cycles"] ? Number(args["--cycles"]) : 1,
  });
  console.log(JSON.stringify(result, null, 2));
}
