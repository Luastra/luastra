const colorPattern = /^(#[0-9a-fA-F]{6}|[a-z][a-z0-9-]*)$/;
const families = Object.freeze({
  color: ["background", "surface", "text", "mutedText", "accent", "danger", "focus"],
  space: ["xs", "sm", "md", "lg", "xl"],
  radius: ["sm", "md", "lg"],
  type: ["body", "heading", "mono"],
  motion: ["fastMs", "normalMs", "reduced"],
});

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

export function validateThemeTokens(value) {
  if (!exactKeys(value, Object.keys(families))) return false;
  if (!exactKeys(value.color, families.color) || !Object.values(value.color).every((item) => typeof item === "string" && colorPattern.test(item))) return false;
  if (!exactKeys(value.space, families.space) || !Object.values(value.space).every((item) => Number.isFinite(item) && item >= 0 && item <= 128)) return false;
  if (!exactKeys(value.radius, families.radius) || !Object.values(value.radius).every((item) => Number.isFinite(item) && item >= 0 && item <= 128)) return false;
  if (!exactKeys(value.type, families.type) || !Object.values(value.type).every((item) => typeof item === "string" && item.length > 0 && item.length <= 128)) return false;
  return exactKeys(value.motion, families.motion) && Number.isFinite(value.motion.fastMs) && value.motion.fastMs >= 0 && value.motion.fastMs <= 10000 &&
    Number.isFinite(value.motion.normalMs) && value.motion.normalMs >= 0 && value.motion.normalMs <= 10000 && typeof value.motion.reduced === "boolean";
}

export function themeToCssVariables(value) {
  if (!validateThemeTokens(value)) throw new Error("invalid theme tokens");
  const variables = {};
  for (const [family, names] of Object.entries(families)) {
    for (const name of names) {
      const raw = value[family][name];
      const suffix = family === "space" || family === "radius" ? "px" : family === "motion" && name.endsWith("Ms") ? "ms" : "";
      variables[`--luastra-${family}-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`] = `${raw}${suffix}`;
    }
  }
  return variables;
}
