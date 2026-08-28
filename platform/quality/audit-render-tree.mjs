import { createHash } from "node:crypto";

import { canonicalJson } from "../../assets/package-assets.mjs";
import { validateRendererTree } from "../protocol/generated/protocol.mjs";

export const referenceRenderQualityBudgets = Object.freeze({
  nodes: 256,
  depth: 16,
  interactiveControls: 64,
  renderTreeBytes: 128 * 1024,
});

const budgetKeys = Object.freeze(Object.keys(referenceRenderQualityBudgets));
const interactiveTypes = new Set(["Button", "TextInput"]);
const supportedRoles = new Set(["alert", "group", "status"]);

function fail(message) { throw new Error(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function nonEmpty(value) { return typeof value === "string" && value.trim() !== ""; }

function admitBudgets(overrides = {}) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) fail("render quality budgets must be an object");
  const unknown = Object.keys(overrides).filter((key) => !budgetKeys.includes(key));
  if (unknown.length > 0) fail(`unknown render quality budget: ${unknown.join(", ")}`);
  const budgets = { ...referenceRenderQualityBudgets, ...overrides };
  for (const key of budgetKeys) {
    if (!Number.isSafeInteger(budgets[key]) || budgets[key] < 1) fail(`render quality budget must be a positive safe integer: ${key}`);
  }
  return Object.freeze(budgets);
}

export function auditRendererTree(tree, { budgets: budgetOverrides = {} } = {}) {
  if (!validateRendererTree(tree)) fail("render quality audit requires a valid semantic renderer tree");
  const budgets = admitBudgets(budgetOverrides);
  const nodes = [];
  const byId = new Map();
  let maximumDepth = 0;
  let interactiveControls = 0;

  const visit = (node, parent, depth, hiddenByAncestor) => {
    const hidden = hiddenByAncestor || node.properties.hidden === true;
    const record = { node, parent, depth, hidden, order: nodes.length };
    nodes.push(record);
    byId.set(node.id, record);
    maximumDepth = Math.max(maximumDepth, depth);
    if (interactiveTypes.has(node.type)) interactiveControls += 1;
    for (const child of node.children) visit(child, record, depth + 1, hidden);
  };
  visit(tree, null, 1, false);

  const findings = [];
  const report = (code, path, detail) => findings.push(Object.freeze({ code, path, detail }));
  if (tree.type !== "Screen") report("ROOT_NOT_SCREEN", tree.id, "the root component must be Screen");
  if (nodes.some(({ node, depth }) => node.type === "Screen" && depth !== 1)) report("NESTED_SCREEN", tree.id, "Screen may appear only at the root");

  const titles = nodes.filter(({ node, hidden }) => node.type === "Text" && node.properties.variant === "title" && !hidden);
  if (titles.length !== 1) report("TITLE_COUNT", tree.id, `expected exactly one visible title, received ${titles.length}`);
  const firstTitleOrder = titles[0]?.order ?? Number.POSITIVE_INFINITY;

  for (const record of nodes) {
    const { node, parent, hidden, order } = record;
    const properties = node.properties;
    if (node.type === "Button" && !nonEmpty(properties.text) && !nonEmpty(properties.label)) {
      report("CONTROL_NAME_MISSING", node.id, "Button requires visible text or an accessible label");
    }
    if (node.type === "TextInput" && !nonEmpty(properties.label)) {
      report("CONTROL_NAME_MISSING", node.id, "TextInput requires an accessible label");
    }
    if ((node.type === "List" || node.type === "Modal") && !nonEmpty(properties.label)) {
      report("CONTAINER_NAME_MISSING", node.id, `${node.type} requires an accessible label`);
    }
    if (node.type === "List" && node.children.some((child) => child.type !== "ListItem")) {
      report("INVALID_LIST_CHILD", node.id, "List children must be ListItem components");
    }
    if (node.type === "ListItem" && parent?.node.type !== "List") {
      report("ORPHAN_LIST_ITEM", node.id, "ListItem must be a direct child of List");
    }
    if (properties.role !== undefined && !supportedRoles.has(properties.role)) {
      report("UNSUPPORTED_ROLE", node.id, `unsupported semantic role: ${properties.role}`);
    }
    if ((properties.role === "status" || properties.role === "alert") && !hidden && !nonEmpty(properties.text)) {
      report("EMPTY_LIVE_REGION", node.id, `${properties.role} content must not be empty while visible`);
    }
    if (node.type === "Text" && properties.variant === "heading" && !hidden && order < firstTitleOrder) {
      report("HEADING_BEFORE_TITLE", node.id, "a visible heading appears before the page title");
    }
    if (node.type === "Text" && (properties.variant === "title" || properties.variant === "heading") && !hidden && !nonEmpty(properties.text)) {
      report("EMPTY_HEADING", node.id, "visible headings require text");
    }
    if (properties.errorId !== undefined) {
      const described = byId.get(properties.errorId);
      if (!described) report("DESCRIPTION_TARGET_MISSING", node.id, `errorId does not resolve: ${properties.errorId}`);
      else if (described.hidden) report("DESCRIPTION_TARGET_HIDDEN", node.id, `errorId resolves to hidden content: ${properties.errorId}`);
      else if (described.node.properties.role !== "alert" || !nonEmpty(described.node.properties.text)) {
        report("DESCRIPTION_TARGET_INVALID", node.id, "errorId must resolve to a non-empty alert");
      }
    }
  }

  const renderTreeBytes = Buffer.byteLength(canonicalJson(tree));
  const usage = Object.freeze({ nodes: nodes.length, depth: maximumDepth, interactiveControls, renderTreeBytes });
  for (const key of budgetKeys) {
    if (usage[key] > budgets[key]) report("QUALITY_BUDGET_EXCEEDED", tree.id, `${key} is ${usage[key]}, limit is ${budgets[key]}`);
  }
  findings.sort((left, right) => `${left.code}\0${left.path}\0${left.detail}`.localeCompare(`${right.code}\0${right.path}\0${right.detail}`));
  const result = findings.length === 0 ? "PASS" : "FAIL";
  const identityInput = { identity: "luastra-render-quality/reference-v1", result, usage, budgets, findings };
  return Object.freeze({
    schemaVersion: 1,
    identity: identityInput.identity,
    result,
    usage,
    budgets,
    findings: Object.freeze(findings),
    contentSha256: sha256(canonicalJson(identityInput)),
  });
}

export function assertRendererTreeQuality(tree, options = {}) {
  const report = auditRendererTree(tree, options);
  if (report.result !== "PASS") {
    fail(`render quality failed: ${report.findings.map((finding) => `${finding.code} at ${finding.path}: ${finding.detail}`).join("; ")}`);
  }
  return report;
}
