import { describe, it, expect, vi } from "vitest";
import { f, createForm } from "./schema.js";
import { createFormStore } from "./store.js";

function makeTestSchema() {
  return createForm({
    name: f.text({ required: true }),
    email: f.email({ default: "test@example.com" }),
    age: f.number({ default: 25 }),
    agreed: f.checkbox({ default: false }),
    role: f.select({ options: ["admin", "user"] as const }),
  });
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("createFormStore — initial state", () => {
  it("creates initial field states from schema defaults", () => {
    const store = createFormStore(makeTestSchema());
    const state = store.getState();

    expect(state.fields.name.value).toBe("");
    expect(state.fields.email.value).toBe("test@example.com");
    expect(state.fields.age.value).toBe(25);
    expect(state.fields.agreed.value).toBe(false);
    expect(state.fields.role.value).toBe("");
  });

  it("all fields start untouched, not dirty, visible, no errors", () => {
    const store = createFormStore(makeTestSchema());
    const state = store.getState();

    for (const name of Object.keys(state.fields)) {
      const field = (state.fields as Record<string, (typeof state.fields)[keyof typeof state.fields]>)[name]!;
      expect(field.touched).toBe(false);
      expect(field.dirty).toBe(false);
      expect(field.visible).toBe(true);
      expect(field.disabled).toBe(false);
      expect(field.error).toBeNull();
      expect(field.validating).toBe(false);
    }
  });

  it("starts with isValid true, isSubmitting false, submitCount 0", () => {
    const store = createFormStore(makeTestSchema());
    const state = store.getState();

    expect(state.isValid).toBe(true);
    expect(state.isSubmitting).toBe(false);
    expect(state.submitCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getValues
// ---------------------------------------------------------------------------

describe("getValues", () => {
  it("returns a plain object of current values", () => {
    const store = createFormStore(makeTestSchema());
    const values = store.getValues();

    expect(values).toEqual({
      name: "",
      email: "test@example.com",
      age: 25,
      agreed: false,
      role: "",
    });
  });

  it("reflects updates after setValue", () => {
    const store = createFormStore(makeTestSchema());
    store.setValue("name", "Angel");
    expect(store.getValues().name).toBe("Angel");
  });
});

// ---------------------------------------------------------------------------
// setValue
// ---------------------------------------------------------------------------

describe("setValue", () => {
  it("updates the field value", () => {
    const store = createFormStore(makeTestSchema());
    store.setValue("name", "Angel");
    expect(store.getState().fields.name.value).toBe("Angel");
  });

  it("marks the field as dirty", () => {
    const store = createFormStore(makeTestSchema());
    store.setValue("name", "Angel");
    expect(store.getState().fields.name.dirty).toBe(true);
  });

  it("does not affect other fields", () => {
    const store = createFormStore(makeTestSchema());
    store.setValue("name", "Angel");
    expect(store.getState().fields.email.value).toBe("test@example.com");
    expect(store.getState().fields.email.dirty).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setTouched
// ---------------------------------------------------------------------------

describe("setTouched", () => {
  it("marks a field as touched", () => {
    const store = createFormStore(makeTestSchema());
    store.setTouched("name");
    expect(store.getState().fields.name.touched).toBe(true);
  });

  it("can untouched a field", () => {
    const store = createFormStore(makeTestSchema());
    store.setTouched("name", true);
    store.setTouched("name", false);
    expect(store.getState().fields.name.touched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setError
// ---------------------------------------------------------------------------

describe("setError", () => {
  it("sets an error on a field", () => {
    const store = createFormStore(makeTestSchema());
    store.setError("name", "Required");
    expect(store.getState().fields.name.error).toBe("Required");
  });

  it("clears an error with null", () => {
    const store = createFormStore(makeTestSchema());
    store.setError("name", "Required");
    store.setError("name", null);
    expect(store.getState().fields.name.error).toBeNull();
  });

  it("marks form as invalid when a field has an error", () => {
    const store = createFormStore(makeTestSchema());
    store.setError("name", "Required");
    expect(store.getState().isValid).toBe(false);
  });

  it("marks form as valid again when all errors are cleared", () => {
    const store = createFormStore(makeTestSchema());
    store.setError("name", "Required");
    store.setError("name", null);
    expect(store.getState().isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setDisabled / setVisible
// ---------------------------------------------------------------------------

describe("setDisabled", () => {
  it("disables a field", () => {
    const store = createFormStore(makeTestSchema());
    store.setDisabled("name", true);
    expect(store.getState().fields.name.disabled).toBe(true);
  });
});

describe("setVisible", () => {
  it("hides a field", () => {
    const store = createFormStore(makeTestSchema());
    store.setVisible("name", false);
    expect(store.getState().fields.name.visible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe("reset", () => {
  it("resets all fields to initial state", () => {
    const store = createFormStore(makeTestSchema());

    store.setValue("name", "Angel");
    store.setTouched("name");
    store.setError("email", "Invalid");
    store.setSubmitting(true);

    store.reset();

    const state = store.getState();
    expect(state.fields.name.value).toBe("");
    expect(state.fields.name.touched).toBe(false);
    expect(state.fields.name.dirty).toBe(false);
    expect(state.fields.email.error).toBeNull();
    expect(state.isSubmitting).toBe(false);
    expect(state.submitCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// resetField
// ---------------------------------------------------------------------------

describe("resetField", () => {
  it("resets a single field without affecting others", () => {
    const store = createFormStore(makeTestSchema());

    store.setValue("name", "Angel");
    store.setValue("email", "angel@test.com");
    store.setTouched("name");

    store.resetField("name");

    expect(store.getState().fields.name.value).toBe("");
    expect(store.getState().fields.name.touched).toBe(false);
    expect(store.getState().fields.name.dirty).toBe(false);
    // email should be untouched by resetField("name")
    expect(store.getState().fields.email.value).toBe("angel@test.com");
  });
});

// ---------------------------------------------------------------------------
// subscribe
// ---------------------------------------------------------------------------

describe("subscribe", () => {
  it("notifies listeners on state changes", () => {
    const store = createFormStore(makeTestSchema());
    const listener = vi.fn();

    store.subscribe(listener);
    store.setValue("name", "Angel");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify after unsubscribe", () => {
    const store = createFormStore(makeTestSchema());
    const listener = vi.fn();

    const unsub = store.subscribe(listener);
    unsub();
    store.setValue("name", "Angel");

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies on reset", () => {
    const store = createFormStore(makeTestSchema());
    const listener = vi.fn();

    store.subscribe(listener);
    store.reset();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("supports multiple listeners", () => {
    const store = createFormStore(makeTestSchema());
    const a = vi.fn();
    const b = vi.fn();

    store.subscribe(a);
    store.subscribe(b);
    store.setValue("name", "X");

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// setSubmitting / incrementSubmitCount
// ---------------------------------------------------------------------------

describe("setSubmitting", () => {
  it("toggles the submitting flag", () => {
    const store = createFormStore(makeTestSchema());

    store.setSubmitting(true);
    expect(store.getState().isSubmitting).toBe(true);

    store.setSubmitting(false);
    expect(store.getState().isSubmitting).toBe(false);
  });
});

describe("incrementSubmitCount", () => {
  it("increments the submit counter", () => {
    const store = createFormStore(makeTestSchema());

    store.incrementSubmitCount();
    expect(store.getState().submitCount).toBe(1);

    store.incrementSubmitCount();
    expect(store.getState().submitCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// schema reference
// ---------------------------------------------------------------------------

describe("schema reference", () => {
  it("exposes the original schema", () => {
    const schema = makeTestSchema();
    const store = createFormStore(schema);
    expect(store.schema).toBe(schema);
  });
});
