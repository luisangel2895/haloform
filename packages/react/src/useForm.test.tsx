import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { createForm, f } from "@haloform/core";
import { useForm } from "./useForm.js";
import React from "react";

// ---------------------------------------------------------------------------
// Test component
// ---------------------------------------------------------------------------

function TestForm({
  onSubmit = vi.fn(),
}: {
  onSubmit?: (values: Record<string, unknown>) => void;
}) {
  const { fields, handleSubmit, isValid, isSubmitting, errors, reset } =
    useForm(
      createForm({
        name: f.text({ required: true, minLength: 2 }),
        email: f.email({ required: true }),
        age: f.number({ min: 0 }),
      }),
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        data-testid="name"
        value={fields.name.value}
        onChange={(e) => fields.name.onChange(e.target.value)}
        onBlur={fields.name.onBlur}
      />
      {fields.name.error && (
        <span data-testid="name-error">{fields.name.error}</span>
      )}

      <input
        data-testid="email"
        value={fields.email.value}
        onChange={(e) => fields.email.onChange(e.target.value)}
        onBlur={fields.email.onBlur}
      />
      {fields.email.error && (
        <span data-testid="email-error">{fields.email.error}</span>
      )}

      <input
        data-testid="age"
        type="number"
        value={fields.age.value}
        onChange={(e) => fields.age.onChange(Number(e.target.value))}
        onBlur={fields.age.onBlur}
      />

      <span data-testid="is-valid">{String(isValid)}</span>
      <span data-testid="is-submitting">{String(isSubmitting)}</span>
      {errors.name && <span data-testid="errors-name">{errors.name}</span>}

      <button data-testid="reset" type="button" onClick={reset}>
        Reset
      </button>
      <button data-testid="submit" type="submit">
        Submit
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useForm", () => {
  it("renders with default values", () => {
    render(<TestForm />);
    expect(screen.getByTestId("name")).toHaveValue("");
    expect(screen.getByTestId("email")).toHaveValue("");
    expect(screen.getByTestId("age")).toHaveValue(0);
    expect(screen.getByTestId("is-valid")).toHaveTextContent("true");
  });

  it("updates field value on change", async () => {
    render(<TestForm />);
    const nameInput = screen.getByTestId("name");

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Angel" } });
    });

    expect(nameInput).toHaveValue("Angel");
  });

  it("validates on blur and shows error", async () => {
    render(<TestForm />);
    const nameInput = screen.getByTestId("name");

    await act(async () => {
      fireEvent.blur(nameInput);
    });

    expect(screen.getByTestId("name-error")).toHaveTextContent(
      "This field is required",
    );
    expect(screen.getByTestId("is-valid")).toHaveTextContent("false");
  });

  it("clears error when valid value is entered after blur", async () => {
    render(<TestForm />);
    const nameInput = screen.getByTestId("name");

    // Trigger blur first to mark as touched
    await act(async () => {
      fireEvent.blur(nameInput);
    });
    expect(screen.getByTestId("name-error")).toBeInTheDocument();

    // Type valid value — should clear error (blur-first strategy)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Angel" } });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("name-error")).not.toBeInTheDocument();
    });
  });

  it("validates email format on blur", async () => {
    render(<TestForm />);
    const emailInput = screen.getByTestId("email");

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "notanemail" } });
      fireEvent.blur(emailInput);
    });

    expect(screen.getByTestId("email-error")).toHaveTextContent(
      "Invalid email address",
    );
  });

  it("handleSubmit validates all fields before calling onSubmit", async () => {
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("submit"));
    });

    // Should NOT call onSubmit — name and email are required
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("name-error")).toBeInTheDocument();
  });

  it("handleSubmit calls onSubmit when form is valid", async () => {
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("name"), {
        target: { value: "Angel" },
      });
      fireEvent.change(screen.getByTestId("email"), {
        target: { value: "angel@test.com" },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("submit"));
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Angel",
      email: "angel@test.com",
      age: 0,
    });
  });

  it("reset clears all fields back to defaults", async () => {
    render(<TestForm />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("name"), {
        target: { value: "Angel" },
      });
      fireEvent.blur(screen.getByTestId("name"));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("reset"));
    });

    expect(screen.getByTestId("name")).toHaveValue("");
    expect(screen.getByTestId("is-valid")).toHaveTextContent("true");
  });
});
