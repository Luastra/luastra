import { rendererTreeError } from "../protocol/generated/protocol.mjs";
import { component } from "./reconciler.mjs";

export function materializeRendererTree(value, { resolveAsset = (reference) => reference } = {}) {
  const treeError = rendererTreeError(value);
  if (treeError !== null) throw new Error(treeError);
  if (typeof resolveAsset !== "function") throw new Error("asset resolver must be a function");
  const visit = (node) => component(node.type, { id: node.id, ...node.properties }, node.children.map(visit), { resolveAsset });
  return visit(value);
}
