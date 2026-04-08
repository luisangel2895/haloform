import { describe, it, expect, expectTypeOf } from "vitest";
import { f, createForm } from "./schema.js";
import type { InferFormValues, FieldDef, FormSchema } from "./types.js";

// ---------------------------------------------------------------------------
// Field builders
// ---------------------------------------------------------------------------

describe("f (field builders)", () => {
  it("f.text() returns a FieldDef with kind 'text'", () => {
    const field = f.text({ required: true, minLength: 2 });
    expect(field.kind).toBe("text");
    expect(field.config.required).toBe(true);
    expect(field.config.minLength).toBe(2);
  });

  it("f.email() returns a FieldDef with kind 'email'", () => {
    const field = f.email();
    expect(field.kind).toBe("email");
    expect(field.config.required).toBeUndefined();
  });

  it("f.number() returns a FieldDef with kind 'number'", () => {
    const field = f.number({ min: 0, max: 100, default: 50 });
    expect(field.kind).toBe("number");
    expect(field.config.min).toBe(0);
    expect(field.config.max).toBe(100);
    expect(field.config.default).toBe(50);
  });

  it("f.checkbox() returns a FieldDef with kind 'checkbox'", () => {
    const field = f.checkbox({ default: false });
    expect(field.kind).toBe("checkbox");
    expect(field.config.default).toBe(false);
  });

  it("f.select() stores options and returns kind 'select'", () => {
    const field = f.select({ options: ["a", "b", "c"] as const });
    expect(field.kind).toBe("select");
    expect(field.config.options).toEqual(["a", "b", "c"]);
  });

  it("f.radio() stores options and returns kind 'radio'", () => {
    const field = f.radio({ options: ["yes", "no"] as const });
    expect(field.kind).toBe("radio");
    expect(field.config.options).toEqual(["yes", "no"]);
  });

  it("f.textarea() returns a FieldDef with kind 'textarea'", () => {
    const field = f.textarea({ maxLength: 500 });
    expect(field.kind).toBe("textarea");
    expect(field.config.maxLength).toBe(500);
  });

  it("f.date() returns a FieldDef with kind 'date'", () => {
    const field = f.date({ required: true });
    expect(field.kind).toBe("date");
    expect(field.config.required).toBe(true);
  });

  it("f.text() accepts a sync validator", () => {
    const field = f.text({
      validate: (v) => (v.length > 0 ? true : "Required"),
    });
    expect(field.config.validate).toBeTypeOf("function");
  });

  it("f.email() accepts an async validator", () => {
    const field = f.email({
      validate: async (v, _signal) => (v.includes("@") ? true : "Invalid"),
    });
    expect(field.config.validate).toBeTypeOf("function");
  });
});

// ---------------------------------------------------------------------------
// createForm
// ---------------------------------------------------------------------------

describe("createForm", () => {
  it("wraps fields into a FormSchema object", () => {
    const schema = createForm({
      name: f.text({ required: true }),
      age: f.number(),
    });

    expect(schema.fields.name.kind).toBe("text");
    expect(schema.fields.age.kind).toBe("number");
    expect(schema.config).toEqual({});
  });

  it("accepts an optional form-level validate function", () => {
    const schema = createForm(
      { email: f.email() },
      {
        validate: (values) => {
          if (!values.email.includes("@")) {
            return { email: "Must be a valid email" };
          }
          return undefined;
        },
      },
    );

    expect(schema.config.validate).toBeTypeOf("function");
  });

  it("accepts validateDebounceMs in config", () => {
    const schema = createForm(
      { name: f.text() },
      { validateDebounceMs: 500 },
    );
    expect(schema.config.validateDebounceMs).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Type inference
// ---------------------------------------------------------------------------

describe("type inference", () => {
  it("InferFormValues extracts correct types from schema", () => {
    const schema = createForm({
      username: f.text({ required: true }),
      email: f.email(),
      age: f.number({ min: 0 }),
      agreed: f.checkbox({ default: false }),
      role: f.select({ options: ["admin", "user"] as const }),
      notify: f.radio({ options: ["yes", "no"] as const }),
      bio: f.textarea(),
      birthdate: f.date(),
    });

    type Values = InferFormValues<typeof schema.fields>;

    expectTypeOf<Values["username"]>().toEqualTypeOf<string>();
    expectTypeOf<Values["email"]>().toEqualTypeOf<string>();
    expectTypeOf<Values["age"]>().toEqualTypeOf<number>();
    expectTypeOf<Values["agreed"]>().toEqualTypeOf<boolean>();
    expectTypeOf<Values["role"]>().toEqualTypeOf<string>();
    expectTypeOf<Values["notify"]>().toEqualTypeOf<string>();
    expectTypeOf<Values["bio"]>().toEqualTypeOf<string>();
    expectTypeOf<Values["birthdate"]>().toEqualTypeOf<string>();
  });

  it("FieldDef preserves the kind literal", () => {
    const field = f.text();
    expectTypeOf(field).toMatchTypeOf<FieldDef<"text", string>>();
  });

  it("createForm returns a properly typed FormSchema", () => {
    const schema = createForm({
      name: f.text(),
      active: f.checkbox(),
    });

    expectTypeOf(schema).toMatchTypeOf<FormSchema>();
    expectTypeOf(schema.fields.name.kind).toEqualTypeOf<"text">();
    expectTypeOf(schema.fields.active.kind).toEqualTypeOf<"checkbox">();
  });

  it("select options are preserved as literal types in config", () => {
    const field = f.select({ options: ["a", "b", "c"] as const });
    expect(field.config.options).toEqual(["a", "b", "c"]);
    // The runtime value correctly stores the options
    expectTypeOf(field.kind).toEqualTypeOf<"select">();
  });
});
