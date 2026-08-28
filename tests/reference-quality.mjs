import assert from "node:assert/strict";
import test from "node:test";

import { auditRendererTree, assertRendererTreeQuality } from "../platform/quality/audit-render-tree.mjs";
import { auditReferenceQuality, referencePerformanceBudgets } from "../scripts/audit-reference-quality.mjs";

function node(type, id, properties = {}, children = []) { return { type, id, properties, children }; }

test("all four reference applications pass one semantic and bounded-render quality profile", async () => {
  const report = await auditReferenceQuality();
  assert.equal(report.result, "PASS");
  assert.equal(report.profile, "reference-quality-v1");
  assert.equal(report.projects.length, 4);
  assert.match(report.reportSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(new Set(report.projects.map((project) => project.role)), new Set([
    "deep-reference", "anti-overfitting-data", "anti-overfitting-visual", "capability-fixture-media",
  ]));
  for (const project of report.projects) {
    assert.equal(project.result, "PASS");
    assert.equal(project.semantics.result, "PASS");
    assert.deepEqual(project.semantics.findings, []);
    assert.equal(project.performance.result, "PASS");
    assert.equal(project.performance.cycles, referencePerformanceBudgets.cycles);
    assert.ok(project.performance.p95CycleMs <= referencePerformanceBudgets.p95CycleMs);
    assert.ok(project.performance.wasmMemoryGrowthBytes <= referencePerformanceBudgets.wasmMemoryGrowthBytes);
  }
});

test("render quality rejects unnamed controls, unlabelled containers and invalid description targets", () => {
  const tree = node("Screen", "bad", {}, [
    node("Text", "bad/title", { text: "Bad", variant: "title" }),
    node("Button", "bad/button", {}),
    node("TextInput", "bad/input", { label: "Name", errorId: "bad/missing" }),
    node("List", "bad/list", {}, [node("Text", "bad/list/text", { text: "Not an item" })]),
  ]);
  const report = auditRendererTree(tree);
  assert.equal(report.result, "FAIL");
  const codes = new Set(report.findings.map((finding) => finding.code));
  for (const code of ["CONTROL_NAME_MISSING", "CONTAINER_NAME_MISSING", "DESCRIPTION_TARGET_MISSING", "INVALID_LIST_CHILD"]) {
    assert.ok(codes.has(code), `missing quality finding ${code}`);
  }
  assert.throws(() => assertRendererTreeQuality(tree), /render quality failed/);
});

test("render quality enforces one page title, hierarchy, live content and deterministic budgets", () => {
  const tree = node("Screen", "quality", {}, [
    node("Text", "quality/heading", { text: "Early heading", variant: "heading" }),
    node("Text", "quality/title", { text: "First title", variant: "title" }),
    node("Text", "quality/title-two", { text: "Second title", variant: "title" }),
    node("Text", "quality/status", { text: "", role: "status" }),
  ]);
  const report = auditRendererTree(tree, { budgets: { nodes: 1 } });
  const codes = new Set(report.findings.map((finding) => finding.code));
  for (const code of ["TITLE_COUNT", "HEADING_BEFORE_TITLE", "EMPTY_LIVE_REGION", "QUALITY_BUDGET_EXCEEDED"]) {
    assert.ok(codes.has(code), `missing quality finding ${code}`);
  }
});
