import { aliases } from "./documentation-navigation.mjs";

// Resolve existing bookmarks before downloading or starting the application VM.
const destination = aliases[location.hash];
if (destination) location.replace(destination);
else {
  addEventListener("hashchange", () => {
    const path = aliases[location.hash];
    if (path) location.replace(path);
  });
  await import("./main.js");
}
