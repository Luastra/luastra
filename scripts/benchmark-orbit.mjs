import { performance } from "node:perf_hooks";

import { computeOrbitLayout } from "../platform/host/orbit-controller.mjs";

const iterations = 20_000;
const warmupIterations = 2_000;
const batchSize = 100;
const maximumAverageMs = 0.25;
const maximumP95Ms = 0.5;

const cases = Object.freeze([
  Object.freeze({
    name: "eight-node-spatial",
    input: Object.freeze({
      width: 1200,
      height: 760,
      nodes: Object.freeze(Array.from({ length: 8 }, (_, index) => Object.freeze({
        id: `spatial-${index + 1}`,
        priority: index < 2 ? 1 : index < 5 ? 2 : 3,
        relatedTo: index === 0 ? ["spatial-2", "spatial-3"] : index === 3 ? ["spatial-5"] : [],
        titleUnits: 14,
        descriptionUnits: 36,
      }))),
    }),
  }),
  Object.freeze({
    name: "fifty-node-list",
    input: Object.freeze({
      width: 1440,
      height: 900,
      maxVisible: 32,
      nodes: Object.freeze(Array.from({ length: 50 }, (_, index) => Object.freeze({
        id: `list-${index + 1}`,
        priority: 2,
        titleUnits: 18,
        descriptionUnits: 42,
      }))),
    }),
  }),
]);

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function runCase(entry) {
  let checksum = 0;
  for (let index = 0; index < warmupIterations; index += 1) checksum += computeOrbitLayout(entry.input).points.length;
  const samples = [];
  const started = performance.now();
  for (let index = 0; index < iterations; index += batchSize) {
    const batchStarted = performance.now();
    for (let offset = 0; offset < batchSize; offset += 1) {
      const layout = computeOrbitLayout(entry.input);
      checksum += layout.points.length + (layout.mode === "spatial" ? 1 : 0);
    }
    samples.push((performance.now() - batchStarted) / batchSize);
  }
  const durationMs = performance.now() - started;
  const averageMs = durationMs / iterations;
  const p95Ms = percentile(samples, 0.95);
  return Object.freeze({
    name: entry.name,
    iterations,
    mode: computeOrbitLayout(entry.input).mode,
    nodeCount: entry.input.nodes.length,
    averageMs,
    p95Ms,
    maximumAverageMs,
    maximumP95Ms,
    checksum,
    passed: averageMs <= maximumAverageMs && p95Ms <= maximumP95Ms,
  });
}

const results = cases.map(runCase);
const report = Object.freeze({
  schemaVersion: 1,
  scope: "Node.js pure layout benchmark; not browser frame-time or device evidence",
  runtime: process.version,
  platform: `${process.platform}-${process.arch}`,
  results,
  passed: results.every((result) => result.passed),
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.passed) process.exitCode = 1;
