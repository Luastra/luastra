#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prototype = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputs = [
  resolve(prototype, "examples/media-player/assets"),
  resolve(prototype, "examples/meditation/content"),
];
const sampleRate = 16_000;

function wav({ seconds, frequency, amplitude = 0.12 }) {
  const samples = Math.round(seconds * sampleRate);
  const dataBytes = samples * 2;
  const bytes = Buffer.alloc(44 + dataBytes);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(36 + dataBytes, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples; index += 1) {
    const envelope = Math.min(1, index / 800, (samples - index) / 800);
    const value = Math.sin(2 * Math.PI * frequency * index / sampleRate) * amplitude * Math.max(0, envelope);
    bytes.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  return bytes;
}

for (const output of outputs) {
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, "focus.wav"), wav({ seconds: 8, frequency: 440 }));
  await writeFile(resolve(output, "rest.wav"), wav({ seconds: 6, frequency: 329.63 }));
}
console.log(JSON.stringify({ result: "PASS", sampleRate, outputs: outputs.length, files: ["focus.wav", "rest.wav"] }));
