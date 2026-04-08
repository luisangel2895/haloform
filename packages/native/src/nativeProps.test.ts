import { describe, it, expect, vi } from "vitest";
import { toTextInputProps, toSwitchProps, toNumberInputProps } from "./nativeProps.js";

function makeStringField(overrides = {}) {
  return {
    value: "",
    error: null,
    touched: false,
    dirty: false,
    disabled: false,
    visible: true,
    validating: false,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  };
}

function makeBoolField(overrides = {}) {
  return {
    value: false,
    error: null,
    touched: false,
    dirty: false,
    disabled: false,
    visible: true,
    validating: false,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  };
}

function makeNumberField(overrides = {}) {
  return {
    value: 0,
    error: null,
    touched: false,
    dirty: false,
    disabled: false,
    visible: true,
    validating: false,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// toTextInputProps
// ---------------------------------------------------------------------------

describe("toTextInputProps", () => {
  it("maps value and callbacks for TextInput", () => {
    const field = makeStringField({ value: "hello" });
    const props = toTextInputProps(field);

    expect(props.value).toBe("hello");
    expect(props.editable).toBe(true);
    expect(typeof props.onChangeText).toBe("function");
    expect(typeof props.onBlur).toBe("function");
  });

  it("onChangeText calls field.onChange", () => {
    const field = makeStringField();
    const props = toTextInputProps(field);

    props.onChangeText("new value");
    expect(field.onChange).toHaveBeenCalledWith("new value");
  });

  it("onBlur calls field.onBlur", () => {
    const field = makeStringField();
    const props = toTextInputProps(field);

    props.onBlur();
    expect(field.onBlur).toHaveBeenCalled();
  });

  it("sets editable=false when disabled", () => {
    const field = makeStringField({ disabled: true });
    const props = toTextInputProps(field);

    expect(props.editable).toBe(false);
  });

  it("passes through field state (error, touched, etc.)", () => {
    const field = makeStringField({
      error: "Required",
      touched: true,
      dirty: true,
    });
    const props = toTextInputProps(field);

    expect(props.error).toBe("Required");
    expect(props.touched).toBe(true);
    expect(props.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toSwitchProps
// ---------------------------------------------------------------------------

describe("toSwitchProps", () => {
  it("maps value and onValueChange for Switch", () => {
    const field = makeBoolField({ value: true });
    const props = toSwitchProps(field);

    expect(props.value).toBe(true);
    expect(typeof props.onValueChange).toBe("function");
  });

  it("onValueChange calls field.onChange", () => {
    const field = makeBoolField();
    const props = toSwitchProps(field);

    props.onValueChange(true);
    expect(field.onChange).toHaveBeenCalledWith(true);
  });

  it("passes disabled state", () => {
    const field = makeBoolField({ disabled: true });
    const props = toSwitchProps(field);

    expect(props.disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toNumberInputProps
// ---------------------------------------------------------------------------

describe("toNumberInputProps", () => {
  it("converts number to string for TextInput value", () => {
    const field = makeNumberField({ value: 42 });
    const props = toNumberInputProps(field);

    expect(props.value).toBe("42");
  });

  it("onChangeText parses string to number and calls onChange", () => {
    const field = makeNumberField();
    const props = toNumberInputProps(field);

    props.onChangeText("123");
    expect(field.onChange).toHaveBeenCalledWith(123);
  });

  it("ignores non-numeric input", () => {
    const field = makeNumberField();
    const props = toNumberInputProps(field);

    props.onChangeText("abc");
    expect(field.onChange).not.toHaveBeenCalled();
  });

  it("handles decimal numbers", () => {
    const field = makeNumberField();
    const props = toNumberInputProps(field);

    props.onChangeText("3.14");
    expect(field.onChange).toHaveBeenCalledWith(3.14);
  });

  it("sets editable=false when disabled", () => {
    const field = makeNumberField({ disabled: true });
    const props = toNumberInputProps(field);

    expect(props.editable).toBe(false);
  });
});
