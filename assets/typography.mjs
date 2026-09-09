import { fontClass } from "../platform/renderer/typography.mjs";
export function projectTypographyCss(assets) {
  const rules = ["/* Generated bounded typography. No remote font sources. */"];
  for (const font of assets.filter((asset) => asset.kind === "font")) {
    if (font.mediaType !== "font/woff2" || !/^assets\/[a-z0-9_/-]+\.woff2$/u.test(font.path)) throw new Error("invalid packaged font");
    const name = fontClass(font.id);
    rules.push(`@font-face{font-family:"${name}";src:url("./${font.path}") format("woff2");font-display:swap;}`);
    rules.push(`.${name}{--luastra-type-face:"${name}";font-family:var(--luastra-type-face),var(--luastra-type-fallback,system-ui),sans-serif;}`);
  }
  for (const [name, fallback] of Object.entries({ sans: "system-ui,sans-serif", serif: "Georgia,serif", mono: "ui-monospace,monospace" })) rules.push(`.luastra-type-fallback-${name}{--luastra-type-fallback:${fallback};font-family:var(--luastra-type-face,var(--luastra-type-fallback)),var(--luastra-type-fallback);}`);
  for (let value = 8; value <= 128; value++) rules.push(`.luastra-type-size-${value}{font-size:${value / 16}rem!important;}`);
  for (let value = 100; value <= 900; value += 100) rules.push(`.luastra-type-weight-${value}{font-weight:${value}!important;}`);
  for (let value = 100; value <= 300; value++) rules.push(`.luastra-type-leading-${value}{line-height:${value / 100}!important;}`);
  return rules.join("\n") + "\n";
}
