#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const prototype = resolve(fileURLToPath(new URL("..", import.meta.url)));
const plugin = resolve(prototype, "native/capacitor-media");
const shell = resolve(prototype, "platform/native/capacitor");
const read = (root, path) => readFile(resolve(root, path), "utf8");

test("native media package is repository-owned and vendor-neutral", async () => {
  const manifest = JSON.parse(await read(plugin, "package.json"));
  assert.equal(manifest.name, "@luastra/capacitor-media");
  assert.equal(manifest.license, "Apache-2.0");
  assert.deepEqual(manifest.peerDependencies, { "@capacitor/core": ">=8.0.0" });
  assert.doesNotMatch(JSON.stringify(manifest), /capgo|capawesome|meditat/i);

  const types = await read(plugin, "dist/esm/index.d.ts");
  for (const operation of ["load", "play", "pause", "seek", "stop", "unload", "state"]) {
    assert.match(types, new RegExp(`"${operation}"`));
  }
  for (const status of ["idle", "loading", "ready", "playing", "paused", "buffering", "ended", "error"]) {
    assert.match(types, new RegExp(`"${status}"`));
  }
});

test("iOS adapter owns playback session, system controls and bounded engine progress", async () => {
  const swift = await read(plugin, "ios/Sources/LuastraMediaPlugin/LuastraMediaPlugin.swift");
  const productionSwift = swift.split("#if DEBUG", 1)[0];
  assert.match(swift, /AVAudioSession\.sharedInstance\(\)\.setCategory\(\.playback/);
  assert.match(swift, /setCategory\(\.playback, mode: \.default, options: \[\]\)/);
  assert.doesNotMatch(swift, /allowAirPlay/);
  assert.match(swift, /MPRemoteCommandCenter\.shared\(\)/);
  assert.match(swift, /MPNowPlayingInfoCenter\.default\(\)/);
  assert.match(swift, /addPeriodicTimeObserver/);
  assert.match(swift, /CMTime\(seconds: 0\.25/);
  assert.match(swift, /AVAudioSession\.interruptionNotification/);
  assert.match(swift, /\.shouldResume/);
  assert.match(productionSwift, /if mayResume && wantsPlayback/);
  assert.match(productionSwift, /try AVAudioSession\.sharedInstance\(\)\.setActive\(true\)[\s\S]*?startPlayback\(\)/);
  assert.match(swift, /AVAudioSession\.routeChangeNotification/);
  assert.match(swift, /private func startPlayback\(\)/);
  assert.match(swift, /player\.seek\(to: \.zero/);
  assert.match(swift, /remoteCommandTargets\.forEach/);
  assert.doesNotMatch(swift, /removeTarget\(nil\)/);
  assert.doesNotMatch(productionSwift, /Timer\.|DispatchSourceTimer|CADisplayLink/);

  const plist = await read(shell, "ios/Info.plist");
  assert.match(plist, /<key>UIBackgroundModes<\/key>[\s\S]*?<string>audio<\/string>/);
});

test("Android adapter owns a Media3 background session without a permanent progress loop", async () => {
  const gradle = await read(plugin, "android/build.gradle");
  assert.match(gradle, /media3Version = '1\.10\.1'/);
  assert.match(gradle, /media3-exoplayer/);
  assert.match(gradle, /media3-session/);

  const service = await read(plugin, "android/src/main/java/dev/luastra/media/LuastraMediaService.java");
  assert.match(service, /extends MediaSessionService/);
  assert.match(service, /new ExoPlayer\.Builder/);
  assert.match(service, /new MediaSession\.Builder/);
  assert.match(service, /setAudioAttributes\(audioAttributes, true\)/);
  assert.match(service, /setWakeMode\(C\.WAKE_MODE_NETWORK\)/);

  const adapter = await read(plugin, "android/src/main/java/dev/luastra/media/LuastraMediaPlugin.java");
  assert.match(adapter, /new MediaController\.Builder/);
  assert.match(adapter, /@CapacitorPlugin\(name = "LuastraMedia"\)/);
  assert.match(adapter, /ContextCompat\.getMainExecutor\(getContext\(\)\)\.execute/);
  assert.match(adapter, /getPlaybackState\(\) == Player\.STATE_ENDED/);
  assert.match(adapter, /controller\.seekTo\(0\)/);
  assert.doesNotMatch(adapter, /Handler|postDelayed|ScheduledExecutor|Timer|Choreographer/);

  const manifest = await read(plugin, "android/src/main/AndroidManifest.xml");
  assert.match(manifest, /android:foregroundServiceType="mediaPlayback"/);
  assert.match(manifest, /android\.permission\.FOREGROUND_SERVICE_MEDIA_PLAYBACK/);
  assert.match(manifest, /android\.permission\.WAKE_LOCK/);
});

test("native source boundary rejects cleartext and arbitrary schemes", async () => {
  const swift = await read(plugin, "ios/Sources/LuastraMediaPlugin/LuastraMediaPlugin.swift");
  assert.match(swift, /scheme == "file"/);
  assert.match(swift, /scheme == "https" \|\| scheme == "capacitor"/);
  assert.match(swift, /path\.hasPrefix\("\/assets\/"\)/);
  assert.match(swift, /appendingPathComponent\("public"/);
  assert.doesNotMatch(swift, /scheme == "http"/);

  const java = await read(plugin, "android/src/main/java/dev/luastra/media/LuastraMediaPlugin.java");
  assert.match(java, /"https"\.equals\(scheme\)/);
  assert.match(java, /"file"\.equals\(scheme\)/);
  assert.match(java, /"content"\.equals\(scheme\)/);
  assert.match(java, /Uri\.parse\("asset:\/\/\/public" \+ path\)/);
  assert.doesNotMatch(java, /"http"\.equals\(scheme\)/);
});
