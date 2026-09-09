import { rendererTreeError } from "../protocol/generated/protocol.mjs";
import { materializeRendererTree } from "../renderer/from-protocol-tree.mjs";

// Output admission only. This does not sandbox the code producing the tree.
const components = new Set(["Screen", "Column", "Row", "Text", "Image", "Shape", "Divider", "Link"]);
const dynamicProperties = new Set(["motion", "onTap", "onInput", "onDismiss"]);

export function admitStartupTree(tree, { resolveAsset, failure = false } = {}) {
  const error = rendererTreeError(tree);
  if (error !== null) throw new Error(`startup tree: ${error}`);
  if (tree.type !== "Screen") throw new Error("startup tree must have a Screen root");
  const visit = (node, root = false) => {
    const retry = failure && node.type === "Button" && node.properties.onTap === "startup.retry";
    if (!components.has(node.type) && !retry) throw new Error(`startup ${node.id}: unsupported component ${node.type}`);
    if (!root && node.type === "Screen") throw new Error(`startup ${node.id}: nested Screen is unsupported`);
    for (const name of Object.keys(node.properties)) {
      if (dynamicProperties.has(name) && !(retry && name === "onTap")) throw new Error(`startup ${node.id}: ${name} requires runtime execution`);
      if (["documentTitle", "documentDescription", "documentLanguage"].includes(name)) {
        throw new Error(`startup ${node.id}: ${name} cannot replace project web metadata`);
      }
    }
    if (node.type === "Link" && !/^https:\/\//.test(node.properties.href ?? "")) {
      throw new Error(`startup ${node.id}: links must use HTTPS and work before application startup`);
    }
    for (const child of node.children) visit(child);
  };
  visit(tree, true);
  // Reuse component semantics and require explicit admission of project assets.
  return materializeRendererTree(tree, { resolveAsset: resolveAsset ?? (() => {
    throw new Error("startup asset requires a project asset resolver");
  }) });
}
