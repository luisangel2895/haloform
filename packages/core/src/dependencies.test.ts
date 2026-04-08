import { describe, it, expect, vi } from "vitest";
import { f, createForm } from "./schema.js";
import { createFormStore } from "./store.js";
import { createDependencyEngine } from "./dependencies.js";

// ---------------------------------------------------------------------------
// Visibility toggling
// ---------------------------------------------------------------------------

describe("visibility toggling", () => {
  it("hides a field when dependency condition is not met", () => {
    const store = createFormStore(
      createForm({
        country: f.select({ options: ["US", "PE", "PT"] as const }),
        state: f.select({
          options: ["CA", "NY", "TX"] as const,
          dependsOn: {
            country: (v: string) => ({
              visible: v === "US",
            }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);

    // Country is "" (default), state should be hidden
    engine.resolve();
    expect(store.getState().fields.state.visible).toBe(false);
  });

  it("shows a field when dependency condition is met", () => {
    const store = createFormStore(
      createForm({
        country: f.select({ options: ["US", "PE", "PT"] as const }),
        state: f.select({
          options: ["CA", "NY", "TX"] as const,
          dependsOn: {
            country: (v: string) => ({
              visible: v === "US",
            }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);

    store.setValue("country", "US");
    engine.resolve();
    expect(store.getState().fields.state.visible).toBe(true);
  });

  it("toggles visibility back when condition changes", () => {
    const store = createFormStore(
      createForm({
        country: f.select({ options: ["US", "PE"] as const }),
        state: f.select({
          options: ["CA", "NY"] as const,
          dependsOn: {
            country: (v: string) => ({ visible: v === "US" }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);

    store.setValue("country", "US");
    engine.resolve();
    expect(store.getState().fields.state.visible).toBe(true);

    store.setValue("country", "PE");
    engine.resolve();
    expect(store.getState().fields.state.visible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Dynamic options
// ---------------------------------------------------------------------------

describe("dynamic options", () => {
  it("updates options based on another field value", () => {
    const US_STATES = ["CA", "NY", "TX"] as const;
    const PE_REGIONS = ["Lima", "Cusco"] as const;

    const store = createFormStore(
      createForm({
        country: f.select({ options: ["US", "PE"] as const }),
        region: f.select({
          options: [] as readonly string[],
          dependsOn: {
            country: (v: string) => ({
              visible: v !== "",
              options: v === "US" ? US_STATES : v === "PE" ? PE_REGIONS : [],
            }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);

    store.setValue("country", "US");
    engine.resolve();
    expect(store.schema.fields.region.config.options).toEqual(["CA", "NY", "TX"]);

    store.setValue("country", "PE");
    engine.resolve();
    expect(store.schema.fields.region.config.options).toEqual(["Lima", "Cusco"]);
  });
});

// ---------------------------------------------------------------------------
// Cascading value updates
// ---------------------------------------------------------------------------

describe("cascading value updates", () => {
  it("resets dependent field value when source changes", () => {
    const store = createFormStore(
      createForm({
        country: f.select({ options: ["US", "PE"] as const }),
        region: f.select({
          options: ["CA", "NY"] as const,
          dependsOn: {
            country: (_v: string) => ({
              value: "", // reset region when country changes
            }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);

    store.setValue("region", "CA");
    expect(store.getValues().region).toBe("CA");

    store.setValue("country", "PE");
    engine.resolveFor("country");
    expect(store.getValues().region).toBe("");
  });
});

// ---------------------------------------------------------------------------
// resolveFor — targeted resolution
// ---------------------------------------------------------------------------

describe("resolveFor", () => {
  it("only resolves fields that depend on the changed field", () => {
    const store = createFormStore(
      createForm({
        a: f.text(),
        b: f.text({
          dependsOn: {
            a: (v: string) => ({ visible: v.length > 0 }),
          },
        }),
        c: f.text({
          dependsOn: {
            a: (v: string) => ({ visible: v === "show" }),
          },
        }),
        d: f.text(), // no dependency on a
      }),
    );
    const engine = createDependencyEngine(store);

    store.setValue("a", "show");
    engine.resolveFor("a");

    expect(store.getState().fields.b.visible).toBe(true);
    expect(store.getState().fields.c.visible).toBe(true);
    expect(store.getState().fields.d.visible).toBe(true); // untouched, default
  });

  it("does nothing when no fields depend on the changed field", () => {
    const spy = vi.fn();
    const store = createFormStore(
      createForm({
        a: f.text(),
        b: f.text(),
      }),
    );
    const engine = createDependencyEngine(store);
    store.subscribe(spy);
    spy.mockClear();

    engine.resolveFor("a");
    // No dependents, so no store updates, no notifications
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Multiple dependencies
// ---------------------------------------------------------------------------

describe("multiple dependencies", () => {
  it("a field can depend on multiple other fields", () => {
    const store = createFormStore(
      createForm({
        hasDiscount: f.checkbox(),
        isPremium: f.checkbox(),
        discountCode: f.text({
          dependsOn: {
            hasDiscount: (v: boolean) => ({
              visible: v === true,
            }),
            isPremium: (v: boolean) => ({
              value: v ? "PREMIUM" : "",
            }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);

    // Initially hidden
    engine.resolve();
    expect(store.getState().fields.discountCode.visible).toBe(false);

    // Show it
    store.setValue("hasDiscount", true);
    engine.resolve();
    expect(store.getState().fields.discountCode.visible).toBe(true);

    // Set premium value
    store.setValue("isPremium", true);
    engine.resolve();
    expect(store.getValues().discountCode).toBe("PREMIUM");
  });
});

// ---------------------------------------------------------------------------
// autoResolve
// ---------------------------------------------------------------------------

describe("autoResolve", () => {
  it("automatically resolves dependencies when store values change", () => {
    const store = createFormStore(
      createForm({
        toggle: f.checkbox(),
        content: f.text({
          dependsOn: {
            toggle: (v: boolean) => ({ visible: v === true }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);
    const unsub = engine.autoResolve();

    // Initial resolve should have run — toggle is false, content hidden
    expect(store.getState().fields.content.visible).toBe(false);

    // Change toggle — autoResolve should pick it up
    store.setValue("toggle", true);
    expect(store.getState().fields.content.visible).toBe(true);

    // Toggle back
    store.setValue("toggle", false);
    expect(store.getState().fields.content.visible).toBe(false);

    unsub();
  });

  it("stops resolving after unsubscribe", () => {
    const store = createFormStore(
      createForm({
        toggle: f.checkbox(),
        content: f.text({
          dependsOn: {
            toggle: (v: boolean) => ({ visible: v === true }),
          },
        }),
      }),
    );
    const engine = createDependencyEngine(store);
    const unsub = engine.autoResolve();

    unsub();

    store.setValue("toggle", true);
    // Should NOT have resolved since we unsubscribed
    // The visibility stays at whatever it was after the last resolve
    // autoResolve ran resolve() initially which set visible=false
    // After unsub, changing toggle should not update visibility
    expect(store.getState().fields.content.visible).toBe(false);
  });
});
