#!/usr/bin/env node

import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execute = promisify(execFile);
const options = Object.fromEntries(process.argv.slice(2).map((entry) => {
  const separator = entry.indexOf("=");
  if (!entry.startsWith("--") || separator < 3) throw new Error(`Invalid argument: ${entry}`);
  return [entry.slice(2, separator), entry.slice(separator + 1)];
}));
const adb = options.adb;
const device = options.device;
const output = options.out;
const durationSeconds = Number(options["duration-seconds"] ?? 900);
const packageName = "dev.luastra.alpha";
if (!adb || !device || !output || !Number.isInteger(durationSeconds) || durationSeconds < 60 || durationSeconds > 3600) throw new Error("adb, device, out and a 60..3600 second duration are required");
const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
const run = async (...args) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return (await execute(adb, ["-s", device, ...args], { maxBuffer: 16 * 1024 * 1024 })).stdout;
    } catch (error) {
      const detail = `${error?.stderr ?? ""}\n${error?.message ?? error}`;
      const transient = /error: closed|device offline|device .* not found|no devices\/emulators found|cannot connect to daemon/i.test(detail);
      if (!transient || attempt === 5) throw error;
      await wait(attempt * 1000);
    }
  }
  throw new Error("unreachable ADB retry state");
};
const battery = (text) => ({
  level: Number(text.match(/^\s*level:\s*(\d+)/m)?.[1]),
  chargeCounterMicroAh: Number(text.match(/^\s*Charge counter:\s*(\d+)/m)?.[1]),
  temperatureTenthsC: Number(text.match(/^\s*temperature:\s*(\d+)/m)?.[1]),
});
const mediaState = (text) => {
  const start = text.indexOf(`package=${packageName}`);
  if (start < 0) return "MISSING";
  const block = text.slice(start, start + 1200);
  return block.match(/state=PlaybackState \{state=([A-Z_]+)\(/)?.[1] ?? "UNKNOWN";
};

const startedAt = new Date();
await run("shell", "dumpsys", "batterystats", "--reset");
const before = battery(await run("shell", "dumpsys", "battery"));
await run("shell", "am", "force-stop", packageName);
await run("shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1");
await wait(3000);
await run("shell", "cmd", "media_session", "dispatch", "play");
await wait(1000);
await run("shell", "input", "keyevent", "KEYCODE_HOME");
await run("shell", "input", "keyevent", "KEYCODE_SLEEP");

const samples = [];
const deadline = Date.now() + durationSeconds * 1000;
let nextSample = 0;
while (Date.now() < deadline) {
  await run("shell", "cmd", "media_session", "dispatch", "play");
  await wait(Math.min(4000, Math.max(1, deadline - Date.now())));
  const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  if (elapsedSeconds >= nextSample) {
    const sessions = await run("shell", "dumpsys", "media_session");
    samples.push({ elapsedSeconds, state: mediaState(sessions) });
    nextSample += 30;
  }
}

const power = await run("shell", "dumpsys", "power");
const sessions = await run("shell", "dumpsys", "media_session");
const after = battery(await run("shell", "dumpsys", "battery"));
const packageDump = await run("shell", "dumpsys", "package", packageName);
const uid = Number(packageDump.match(/userId=(\d+)/)?.[1]);
const batteryStats = await run("shell", "dumpsys", "batterystats");
const uidLabel = Number.isInteger(uid) && uid >= 10000 ? `UID u0a${uid - 10000}:` : null;
const uidStart = uidLabel ? batteryStats.indexOf(uidLabel) : -1;
const uidExcerpt = uidStart >= 0 ? batteryStats.slice(uidStart, uidStart + 2200).split("\n").slice(0, 14) : [];
const playingSamples = samples.filter((sample) => sample.state === "PLAYING").length;
const finalState = mediaState(sessions);
const durationReached = (Date.now() - startedAt.getTime()) >= durationSeconds * 1000;
const wakefulness = power.match(/mWakefulness=(Asleep|Dozing|Dreaming|Awake)/)?.[1] ?? "UNKNOWN";
const screenOff = new Set(["Asleep", "Dozing", "Dreaming"]).has(wakefulness);
const dischargeMicroAh = Number.isFinite(before.chargeCounterMicroAh) && Number.isFinite(after.chargeCounterMicroAh)
  ? Math.max(0, before.chargeCounterMicroAh - after.chargeCounterMicroAh)
  : null;
const pass = durationReached && screenOff && samples.length >= Math.floor(durationSeconds / 35) && playingSamples / samples.length >= 0.8 && finalState !== "MISSING";
const proof = {
  schemaVersion: 1,
  evidenceClass: "PHYSICAL_ANDROID_LONG_BACKGROUND_ENERGY",
  device: "Pixel 7 Pro",
  package: packageName,
  plannedDurationSeconds: durationSeconds,
  observedDurationSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
  wakefulness,
  screenOff,
  before,
  after,
  dischargeMicroAh,
  samples,
  playingSamples,
  finalState,
  uid,
  uidBatteryStatsExcerpt: uidExcerpt,
  result: pass ? "PASS" : "FAIL",
  boundary: "The debug fixture reissues idempotent MediaSession Play every four seconds because its admitted WAV is eight seconds long; production meditation tracks are naturally long-lived.",
};
await run("shell", "input", "keyevent", "KEYCODE_WAKEUP");
await writeFile(output, `${JSON.stringify(proof, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(proof, null, 2)}\n`);
if (!pass) process.exitCode = 1;
