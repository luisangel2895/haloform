import { describe, it, expect, vi } from "vitest";
import { f } from "./schema.js";
import { createMultiStepForm, createMultiStepStore } from "./multistep.js";

function makeCheckoutSchema() {
  return createMultiStepForm([
    {
      name: "shipping",
      fields: {
        firstName: f.text({ required: true }),
        lastName: f.text({ required: true }),
        address: f.text({ required: true }),
      },
    },
    {
      name: "payment",
      fields: {
        cardNumber: f.text({ required: true, minLength: 16, maxLength: 16 }),
        expiry: f.text({ required: true }),
        cvv: f.text({ required: true, minLength: 3, maxLength: 4 }),
      },
    },
    {
      name: "review",
      fields: {
        notes: f.textarea(),
        agreed: f.checkbox({ required: true }),
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Schema creation
// ---------------------------------------------------------------------------

describe("createMultiStepForm", () => {
  it("creates a schema with step definitions", () => {
    const schema = makeCheckoutSchema();
    expect(schema.steps).toHaveLength(3);
    expect(schema.steps[0]!.name).toBe("shipping");
    expect(schema.steps[1]!.name).toBe("payment");
    expect(schema.steps[2]!.name).toBe("review");
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe("navigation", () => {
  it("starts at step 0", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    expect(ms.getCurrentStep()).toBe(0);
    expect(ms.getCurrentStepName()).toBe("shipping");
  });

  it("isFirstStep / isLastStep", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    expect(ms.isFirstStep()).toBe(true);
    expect(ms.isLastStep()).toBe(false);
  });

  it("prevStep does nothing on first step", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    ms.prevStep();
    expect(ms.getCurrentStep()).toBe(0);
  });

  it("goToStep navigates directly", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    ms.goToStep(2);
    expect(ms.getCurrentStep()).toBe(2);
    expect(ms.getCurrentStepName()).toBe("review");
    expect(ms.isLastStep()).toBe(true);
  });

  it("goToStep ignores out-of-range indices", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    ms.goToStep(-1);
    expect(ms.getCurrentStep()).toBe(0);
    ms.goToStep(99);
    expect(ms.getCurrentStep()).toBe(0);
  });

  it("getTotalSteps returns correct count", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    expect(ms.getTotalSteps()).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Step fields
// ---------------------------------------------------------------------------

describe("getCurrentStepFields", () => {
  it("returns field names for the current step", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    expect(ms.getCurrentStepFields()).toEqual(["firstName", "lastName", "address"]);

    ms.goToStep(1);
    expect(ms.getCurrentStepFields()).toEqual(["cardNumber", "expiry", "cvv"]);

    ms.goToStep(2);
    expect(ms.getCurrentStepFields()).toEqual(["notes", "agreed"]);
  });
});

// ---------------------------------------------------------------------------
// Per-step validation with nextStep
// ---------------------------------------------------------------------------

describe("nextStep with validation", () => {
  it("blocks navigation when current step has validation errors", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    // Step 0 fields are all required but empty
    const advanced = await ms.nextStep();
    expect(advanced).toBe(false);
    expect(ms.getCurrentStep()).toBe(0);
  });

  it("advances when current step is valid", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("lastName", "Orellana");
    ms.store.setValue("address", "123 Main St");

    const advanced = await ms.nextStep();
    expect(advanced).toBe(true);
    expect(ms.getCurrentStep()).toBe(1);
    expect(ms.getCurrentStepName()).toBe("payment");
  });

  it("does not advance past the last step", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    // Fill all steps and navigate to the end
    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("lastName", "Orellana");
    ms.store.setValue("address", "123 Main St");
    await ms.nextStep(); // → step 1

    ms.store.setValue("cardNumber", "1234567812345678");
    ms.store.setValue("expiry", "12/28");
    ms.store.setValue("cvv", "123");
    await ms.nextStep(); // → step 2

    ms.store.setValue("agreed", true);
    const advanced = await ms.nextStep(); // already last step
    expect(advanced).toBe(true);
    expect(ms.getCurrentStep()).toBe(2); // stays on last step
  });
});

// ---------------------------------------------------------------------------
// validateCurrentStep
// ---------------------------------------------------------------------------

describe("validateCurrentStep", () => {
  it("validates only the current step fields", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("lastName", "Orellana");
    ms.store.setValue("address", "123 Main St");

    const valid = await ms.validateCurrentStep();
    expect(valid).toBe(true);

    // Payment fields are invalid but we're on step 0, so they don't matter
    expect(ms.store.getState().fields.cardNumber.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateAll
// ---------------------------------------------------------------------------

describe("validateAll", () => {
  it("returns false when any step has errors", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    const valid = await ms.validateAll();
    expect(valid).toBe(false);
  });

  it("returns true when all steps are valid", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("lastName", "Orellana");
    ms.store.setValue("address", "123 Main St");
    ms.store.setValue("cardNumber", "1234567812345678");
    ms.store.setValue("expiry", "12/28");
    ms.store.setValue("cvv", "123");
    ms.store.setValue("agreed", true);

    const valid = await ms.validateAll();
    expect(valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getValues
// ---------------------------------------------------------------------------

describe("getValues", () => {
  it("returns merged values from all steps", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("cardNumber", "1234567812345678");
    ms.store.setValue("notes", "Please wrap nicely");

    const values = ms.getValues();
    expect(values.firstName).toBe("Angel");
    expect(values.cardNumber).toBe("1234567812345678");
    expect(values.notes).toBe("Please wrap nicely");
  });
});

// ---------------------------------------------------------------------------
// Step-level cross validation
// ---------------------------------------------------------------------------

describe("step-level cross validation", () => {
  it("runs step validate function and blocks nextStep", async () => {
    const schema = createMultiStepForm([
      {
        name: "passwords",
        fields: {
          password: f.text({ required: true }),
          confirm: f.text({ required: true }),
        },
        validate: (values) => {
          if (values.password !== values.confirm) {
            return { confirm: "Passwords do not match" };
          }
          return undefined;
        },
      },
      {
        name: "done",
        fields: {
          email: f.email(),
        },
      },
    ]);

    const ms = createMultiStepStore(schema);
    ms.store.setValue("password", "abc123");
    ms.store.setValue("confirm", "xyz789");

    const advanced = await ms.nextStep();
    expect(advanced).toBe(false);
    expect(ms.store.getState().fields.confirm.error).toBe("Passwords do not match");

    // Fix it
    ms.store.setValue("confirm", "abc123");
    const advanced2 = await ms.nextStep();
    expect(advanced2).toBe(true);
    expect(ms.getCurrentStep()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// onStepChange
// ---------------------------------------------------------------------------

describe("onStepChange", () => {
  it("notifies listeners when step changes", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    const listener = vi.fn();
    ms.onStepChange(listener);

    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("lastName", "Orellana");
    ms.store.setValue("address", "123 Main St");

    await ms.nextStep();
    expect(listener).toHaveBeenCalledWith(1);

    ms.prevStep();
    expect(listener).toHaveBeenCalledWith(0);
  });

  it("stops notifying after unsubscribe", () => {
    const ms = createMultiStepStore(makeCheckoutSchema());
    const listener = vi.fn();
    const unsub = ms.onStepChange(listener);

    unsub();
    ms.goToStep(2);
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Concurrent nextStep guard
// ---------------------------------------------------------------------------

describe("concurrent nextStep", () => {
  it("prevents double-advance when nextStep is called concurrently", async () => {
    const ms = createMultiStepStore(makeCheckoutSchema());

    // Fill step 0 required fields
    ms.store.setValue("firstName", "Angel");
    ms.store.setValue("lastName", "Orellana");
    ms.store.setValue("address", "123 Main St");

    // Call nextStep twice at the same time
    const [first, second] = await Promise.all([ms.nextStep(), ms.nextStep()]);

    // One should succeed, one should be blocked
    expect(ms.getCurrentStep()).toBe(1);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
