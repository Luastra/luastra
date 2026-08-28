const routePattern = /^[a-z][a-z0-9-]*$/;

function fail(message) { throw new Error(message); }

export class Router {
  #routes;
  #history;

  constructor(routes, initial) {
    if (!routes || typeof routes !== "object" || Array.isArray(routes)) fail("routes must be an object");
    const entries = Object.entries(routes);
    if (entries.length === 0) fail("at least one route is required");
    for (const [name, definition] of entries) {
      if (!routePattern.test(name) || typeof definition?.render !== "function") fail(`invalid route: ${name}`);
      if (definition.focusId !== undefined && typeof definition.focusId !== "string") fail(`invalid route focus: ${name}`);
    }
    if (!Object.hasOwn(routes, initial)) fail(`unknown initial route: ${initial}`);
    this.#routes = Object.freeze({ ...routes });
    this.#history = [initial];
  }

  get current() { return this.#history.at(-1); }
  get canGoBack() { return this.#history.length > 1; }

  snapshot() {
    const route = this.#routes[this.current];
    return Object.freeze({ name: this.current, tree: route.render(), focusId: route.focusId ?? null });
  }

  navigate(name, { replace = false } = {}) {
    if (!Object.hasOwn(this.#routes, name)) fail(`unknown route: ${name}`);
    if (replace) this.#history[this.#history.length - 1] = name;
    else if (name !== this.current) this.#history.push(name);
    return this.snapshot();
  }

  back() {
    if (this.#history.length > 1) this.#history.pop();
    return this.snapshot();
  }
}
