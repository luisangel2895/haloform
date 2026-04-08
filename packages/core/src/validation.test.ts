import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { f, createForm } from "./schema.js";
import { createFormStore } from "./store.js";
import { createValidationEngine } from "./validation.js";
import type { FormStore } from "./store.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Built-in validators: required
// ---------------------------------------------------------------------------

describe("built-in: required", () => {
  it("returns error for empty required text field", async () => {
    const store = createFormStore(createForm({ name: f.text({ required: true }) }));
    const engine = createValidationEngine(store);

    const error = await engine.validateField("name");
    expect(error).toBe("This field is required");
    expect(store.getState().fields.name.error).toBe("This field is required");
  });

  it("passes when required text field has a value", async () => {
    const store = createFormStore(createForm({ name: f.text({ required: true }) }));
    const engine = createValidationEngine(store);

    store.setValue("name", "Angel");
    const error = await engine.validateField("name");
    expect(error).toBeNull();
  });

  it("returns error for required unchecked checkbox", async () => {
    const store = createFormStore(createForm({ agreed: f.checkbox({ required: true }) }));
    const engine = createValidationEngine(store);

    const error = await engine.validateField("agreed");
    expect(error).toBe("This field is required");
  });

  it("passes for required checked checkbox", async () => {
    const store = createFormStore(createForm({ agreed: f.checkbox({ required: true }) }));
    const engine = createValidationEngine(store);

    store.setValue("agreed", true);
    const error = await engine.validateField("agreed");
    expect(error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Built-in validators: minLength / maxLength
// ---------------------------------------------------------------------------

describe("built-in: minLength / maxLength", () => {
  it("fails when text is shorter than minLength", async () => {
    const store = createFormStore(createForm({ name: f.text({ minLength: 3 }) }));
    const engine = createValidationEngine(store);

    store.setValue("name", "ab");
    const error = await engine.validateField("name");
    expect(error).toBe("Must be at least 3 characters");
  });

  it("passes when text meets minLength", async () => {
    const store = createFormStore(createForm({ name: f.text({ minLength: 3 }) }));
    const engine = createValidationEngine(store);

    store.setValue("name", "abc");
    expect(await engine.validateField("name")).toBeNull();
  });

  it("skips minLength check on empty value (not required)", async () => {
    const store = createFormStore(createForm({ name: f.text({ minLength: 3 }) }));
    const engine = createValidationEngine(store);

    expect(await engine.validateField("name")).toBeNull();
  });

  it("fails when text exceeds maxLength", async () => {
    const store = createFormStore(createForm({ bio: f.textarea({ maxLength: 5 }) }));
    const engine = createValidationEngine(store);

    store.setValue("bio", "toolong");
    expect(await engine.validateField("bio")).toBe("Must be at most 5 characters");
  });
});

// ---------------------------------------------------------------------------
// Built-in validators: min / max (number)
// ---------------------------------------------------------------------------

describe("built-in: min / max", () => {
  it("fails when number is below min", async () => {
    const store = createFormStore(createForm({ age: f.number({ min: 18 }) }));
    const engine = createValidationEngine(store);

    store.setValue("age", 10);
    expect(await engine.validateField("age")).toBe("Must be at least 18");
  });

  it("fails when number exceeds max", async () => {
    const store = createFormStore(createForm({ age: f.number({ max: 100 }) }));
    const engine = createValidationEngine(store);

    store.setValue("age", 150);
    expect(await engine.validateField("age")).toBe("Must be at most 100");
  });

  it("passes when number is in range", async () => {
    const store = createFormStore(createForm({ age: f.number({ min: 18, max: 100 }) }));
    const engine = createValidationEngine(store);

    store.setValue("age", 25);
    expect(await engine.validateField("age")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Built-in validators: email format
// ---------------------------------------------------------------------------

describe("built-in: email", () => {
  it("fails for invalid email", async () => {
    const store = createFormStore(createForm({ email: f.email() }));
    const engine = createValidationEngine(store);

    store.setValue("email", "notanemail");
    expect(await engine.validateField("email")).toBe("Invalid email address");
  });

  it("passes for valid email", async () => {
    const store = createFormStore(createForm({ email: f.email() }));
    const engine = createValidationEngine(store);

    store.setValue("email", "angel@test.com");
    expect(await engine.validateField("email")).toBeNull();
  });

  it("skips email check on empty value (not required)", async () => {
    const store = createFormStore(createForm({ email: f.email() }));
    const engine = createValidationEngine(store);

    expect(await engine.validateField("email")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Built-in validators: pattern
// ---------------------------------------------------------------------------

describe("built-in: pattern", () => {
  it("fails when value does not match pattern", async () => {
    const store = createFormStore(createForm({ code: f.text({ pattern: /^\d{4}$/ }) }));
    const engine = createValidationEngine(store);

    store.setValue("code", "abc");
    expect(await engine.validateField("code")).toBe("Invalid format");
  });

  it("passes when value matches pattern", async () => {
    const store = createFormStore(createForm({ code: f.text({ pattern: /^\d{4}$/ }) }));
    const engine = createValidationEngine(store);

    store.setValue("code", "1234");
    expect(await engine.validateField("code")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Custom sync validator
// ---------------------------------------------------------------------------

describe("custom sync validator", () => {
  it("runs after built-in validators pass", async () => {
    const store = createFormStore(
      createForm({
        name: f.text({
          required: true,
          validate: (v) => (v.includes("X") ? "No X allowed" : true),
        }),
      }),
    );
    const engine = createValidationEngine(store);

    // First fails on required
    expect(await engine.validateField("name")).toBe("This field is required");

    // Then fails on custom
    store.setValue("name", "AXE");
    expect(await engine.validateField("name")).toBe("No X allowed");

    // Then passes
    store.setValue("name", "Angel");
    expect(await engine.validateField("name")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Custom async validator
// ---------------------------------------------------------------------------

describe("custom async validator", () => {
  it("resolves with error from async validator", async () => {
    const store = createFormStore(
      createForm({
        email: f.email({
          validate: async (v, _signal) => {
            await flush();
            return v === "taken@test.com" ? "Email taken" : true;
          },
        }),
      }),
    );
    const engine = createValidationEngine(store);

    store.setValue("email", "taken@test.com");
    expect(await engine.validateField("email")).toBe("Email taken");
  });

  it("resolves with null for valid async result", async () => {
    const store = createFormStore(
      createForm({
        email: f.email({
          validate: async (v, _signal) => {
            await flush();
            return v === "taken@test.com" ? "Email taken" : true;
          },
        }),
      }),
    );
    const engine = createValidationEngine(store);

    store.setValue("email", "free@test.com");
    expect(await engine.validateField("email")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Abort stale async validations
// ---------------------------------------------------------------------------

describe("abort stale validations", () => {
  it("aborts previous async validation when a new one starts", async () => {
    // Use manually resolved promises so we control exact order
    let resolveFirst!: () => void;
    let resolveSecond!: () => void;
    const firstGate = new Promise<void>((r) => { resolveFirst = r; });
    const secondGate = new Promise<void>((r) => { resolveSecond = r; });
    const signals: { value: string; aborted: boolean }[] = [];

    const store = createFormStore(
      createForm({
        email: f.email({
          validate: async (v, signal) => {
            if (v === "first@test.com") {
              await firstGate;
            } else {
              await secondGate;
            }
            signals.push({ value: v, aborted: signal.aborted });
            return true;
          },
        }),
      }),
    );
    const engine = createValidationEngine(store);

    // Start first validation
    store.setValue("email", "first@test.com");
    const p1 = engine.validateField("email");

    // Start second validation — this aborts first's AbortController
    store.setValue("email", "second@test.com");
    const p2 = engine.validateField("email");

    // Resolve second first, then first
    resolveSecond();
    await p2;

    resolveFirst();
    await p1;

    // First's signal was aborted, second's was not
    const firstSignal = signals.find((s) => s.value === "first@test.com");
    const secondSignal = signals.find((s) => s.value === "second@test.com");

    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);

    // Engine returned null for the aborted one
    expect(await p1).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Debounced validation on change
// ---------------------------------------------------------------------------

describe("debounced validation on change", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not validate on change if field is not touched", () => {
    const validateFn = vi.fn(() => true as const);
    const store = createFormStore(
      createForm({
        name: f.text({ validate: validateFn }),
      }),
    );
    const engine = createValidationEngine(store);

    engine.handleChange("name", "test");
    vi.advanceTimersByTime(500);

    // validate should not be called because field isn't touched
    expect(validateFn).not.toHaveBeenCalled();
  });

  it("validates on change after field has been touched (blur-first)", async () => {
    vi.useRealTimers(); // need real timers for async

    const validateFn = vi.fn((v: string) => (v === "bad" ? "Bad value" : true));
    const store = createFormStore(
      createForm({
        name: f.text({ validate: validateFn }),
      }),
    );
    const engine = createValidationEngine(store);

    // First blur — marks as touched and validates
    engine.handleBlur("name");
    await flush();
    expect(store.getState().fields.name.touched).toBe(true);

    // Now change — should trigger validation because touched
    validateFn.mockClear();
    engine.handleChange("name", "bad");
    await flush();

    // Sync validators run immediately for touched fields
    expect(validateFn).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleBlur
// ---------------------------------------------------------------------------

describe("handleBlur", () => {
  it("marks field as touched and validates", async () => {
    const store = createFormStore(createForm({ name: f.text({ required: true }) }));
    const engine = createValidationEngine(store);

    engine.handleBlur("name");
    await flush();

    expect(store.getState().fields.name.touched).toBe(true);
    expect(store.getState().fields.name.error).toBe("This field is required");
  });
});

// ---------------------------------------------------------------------------
// validateAll
// ---------------------------------------------------------------------------

describe("validateAll", () => {
  it("validates all fields and returns true when all valid", async () => {
    const store = createFormStore(
      createForm({
        name: f.text({ required: true }),
        email: f.email(),
      }),
    );
    const engine = createValidationEngine(store);

    store.setValue("name", "Angel");
    const valid = await engine.validateAll();
    expect(valid).toBe(true);
  });

  it("returns false when any field is invalid", async () => {
    const store = createFormStore(
      createForm({
        name: f.text({ required: true }),
        email: f.email(),
      }),
    );
    const engine = createValidationEngine(store);

    const valid = await engine.validateAll();
    expect(valid).toBe(false);
    expect(store.getState().fields.name.error).toBe("This field is required");
  });
});

// ---------------------------------------------------------------------------
// Cross-field validation
// ---------------------------------------------------------------------------

describe("cross-field validation", () => {
  it("runs form-level validate and sets errors on fields", async () => {
    const store = createFormStore(
      createForm(
        {
          password: f.text({ required: true }),
          confirm: f.text({ required: true }),
        },
        {
          validate: (values) => {
            if (values.password !== values.confirm) {
              return { confirm: "Passwords do not match" };
            }
            return undefined;
          },
        },
      ),
    );
    const engine = createValidationEngine(store);

    store.setValue("password", "abc123");
    store.setValue("confirm", "xyz789");

    const errors = engine.validateCrossField();
    expect(errors).toEqual({ confirm: "Passwords do not match" });
    expect(store.getState().fields.confirm.error).toBe("Passwords do not match");
  });

  it("returns undefined when cross-field validation passes", () => {
    const store = createFormStore(
      createForm(
        {
          password: f.text({ required: true }),
          confirm: f.text({ required: true }),
        },
        {
          validate: (values) => {
            if (values.password !== values.confirm) {
              return { confirm: "Passwords do not match" };
            }
            return undefined;
          },
        },
      ),
    );
    const engine = createValidationEngine(store);

    store.setValue("password", "abc123");
    store.setValue("confirm", "abc123");

    expect(engine.validateCrossField()).toBeUndefined();
  });

  it("validateAll runs cross-field validation too", async () => {
    const store = createFormStore(
      createForm(
        {
          password: f.text({ required: true }),
          confirm: f.text({ required: true }),
        },
        {
          validate: (values) => {
            if (values.password !== values.confirm) {
              return { confirm: "Passwords do not match" };
            }
            return undefined;
          },
        },
      ),
    );
    const engine = createValidationEngine(store);

    store.setValue("password", "abc123");
    store.setValue("confirm", "xyz789");

    const valid = await engine.validateAll();
    expect(valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NaN / Infinity number validation
// ---------------------------------------------------------------------------

describe("NaN and Infinity validation", () => {
  it("rejects NaN for number fields with min/max", async () => {
    const store = createFormStore(
      createForm({ age: f.number({ min: 0, max: 100 }) }),
    );
    const engine = createValidationEngine(store);

    store.setValue("age", NaN);
    const error = await engine.validateField("age");
    expect(error).toBe("Must be a valid number");
  });

  it("rejects Infinity for number fields", async () => {
    const store = createFormStore(
      createForm({ age: f.number({ min: 0 }) }),
    );
    const engine = createValidationEngine(store);

    store.setValue("age", Infinity);
    const error = await engine.validateField("age");
    expect(error).toBe("Must be a valid number");
  });
});

// ---------------------------------------------------------------------------
// validating flag
// ---------------------------------------------------------------------------

describe("validating flag", () => {
  it("sets validating=true during async validation and false after", async () => {
    let resolveFn: (v: true) => void;
    const schema = createForm({
      username: f.text({
        validate: (_value: string, _signal: AbortSignal) =>
          new Promise<true>((r) => { resolveFn = r; }),
      }),
    });
    const store = createFormStore(schema);
    const engine = createValidationEngine(store, { debounceMs: 0 });

    store.setValue("username", "test");

    const validatePromise = engine.validateField("username");

    // Should be validating
    await flush();
    const duringState = store.getState().fields as Record<string, { validating: boolean }>;
    expect(duringState.username.validating).toBe(true);

    // Resolve the async validator
    resolveFn!(true);
    await validatePromise;

    const afterState = store.getState().fields as Record<string, { validating: boolean }>;
    expect(afterState.username.validating).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dispose
// ---------------------------------------------------------------------------

describe("dispose", () => {
  it("cleans up without errors", () => {
    const store = createFormStore(createForm({ name: f.text() }));
    const engine = createValidationEngine(store);

    expect(() => engine.dispose()).not.toThrow();
  });
});
