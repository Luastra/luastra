export const catalogueCards = Object.freeze([
  Object.freeze({
    id: "catalogue/breathe",
    entrance: Object.freeze({
      opacity: Object.freeze({ kind: "tween", from: 0, to: 1, durationMs: 180, easing: "linear" }),
      translateY: Object.freeze({ kind: "tween", from: 18, to: 0, durationMs: 240, easing: "easeOutCubic" }),
    }),
  }),
  Object.freeze({
    id: "catalogue/focus",
    entrance: Object.freeze({
      opacity: Object.freeze({ kind: "tween", from: 0, to: 1, durationMs: 220, easing: "easeInOutCubic" }),
      translateY: Object.freeze({ kind: "tween", from: 24, to: 0, durationMs: 280, easing: "easeOutCubic" }),
    }),
  }),
]);

export function startCatalogueEntrance(session) {
  return catalogueCards.flatMap((card) => Object.entries(card.entrance).map(([property, descriptor]) =>
    session.animate(card.id, property, descriptor)));
}
