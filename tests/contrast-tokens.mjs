import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function luminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(left, right) {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("admitted light and dark semantic color pairs meet normal-text contrast", async () => {
  const pairs = [
    ["light body", "#16342e", "#f4efe3"],
    ["light muted surface", "#526a64", "#fffdf7"],
    ["light action", "#ffffff", "#2f7568"],
    ["light themed link", "#2f7568", "#f4efe3"],
    ["light danger", "#ffffff", "#9c3c32"],
    ["dark body", "#f4efe3", "#102722"],
    ["dark muted surface", "#bdd0ca", "#16342e"],
    ["dark action", "#071815", "#4b9b8d"],
    ["dark action hover", "#071815", "#62ad9f"],
    ["dark ghost", "#8fd2bf", "#16342e"],
    ["dark error text", "#e9897f", "#16342e"],
    ["dark danger action", "#ffffff", "#9c3c32"],
    ["meditation dark action", "#ffffff", "#34796a"],
    ["meditation dark action hover", "#ffffff", "#285f54"],
    ["meditation dark ghost", "#95d8c2", "#0d2822"],
  ];
  for (const [name, foreground, background] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, `${name} contrast is ${contrast(foreground, background).toFixed(3)}:1`);
  }
  const css = await readFile(new URL("../host/phase5-ui.css", import.meta.url), "utf8");
  assert.match(css, /--luastra-color-on-accent/);
  assert.match(css, /--luastra-color-accent-text/);
  assert.match(css, /--luastra-color-danger-text/);
  assert.match(css, /\.luastra-action-primary \{ color: var\(--luastra-color-on-accent\)/);
  assert.match(css, /\.luastra-action-ghost \{ color: var\(--luastra-color-accent-text\)/);
  assert.match(css, /\.luastra-tone-error \{ color: var\(--luastra-color-danger-text\)/);
});
